import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { parseCardId, type CardId } from "./card-id.js";
import { discardCards } from "./collection.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import {
  ACCESS_TOKEN,
  USER_ID,
  fakeFetch,
  restRequest,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";

const INITIAL_BALANCE = 7000;

interface Entry {
  id: string;
  card_id: CardId;
}

function entry(index: number): Entry {
  const suffix = String(index).padStart(12, "0");
  return {
    id: `00000000-0000-4000-8000-${suffix}`,
    card_id: parseCardId(`11111111-1111-4111-8111-${suffix}`),
  };
}

function entries(count: number): Entry[] {
  return Array.from({ length: count }, (_, index) => entry(index));
}

function pair(): [Entry, Entry] {
  return [entry(0), entry(1)];
}

function cardIds(rows: readonly Entry[]): CardId[] {
  return rows.map(({ card_id }) => card_id);
}

function collectionSelect(rows: readonly Entry[]): Route {
  const isCollectionRead = restRequest("GET", "user_cards");
  return (request) => {
    if (!isCollectionRead(request)) return undefined;
    const wanted = (request.url.searchParams.get("card_id") ?? "")
      .replace(/^in\.\(|\)$/g, "")
      .split(",");
    return {
      status: 200,
      body: rows.filter(({ card_id }) => wanted.includes(card_id)),
    };
  };
}

function bulkDiscard(failed: (ids: string[]) => unknown[] = () => []): Route {
  let balance = INITIAL_BALANCE;
  return ({ method, url, body }) => {
    if (method !== "POST" || url.pathname !== "/api/user-cards/bulk-discard")
      return undefined;
    const { card_ids } = JSON.parse(body ?? "{}") as { card_ids: string[] };
    const refused = failed(card_ids);
    const count = card_ids.length - refused.length;
    balance += count;
    return {
      status: 200,
      body: { balance, discarded_count: count, failed: refused },
    };
  };
}

async function sessionWith(...routes: Route[]) {
  const { fetch, requests } = fakeFetch(tokenRefresh, ...routes);
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  return { session, requests };
}

function collectionWith(rows: readonly Entry[]) {
  return sessionWith(collectionSelect(rows), bulkDiscard());
}

function discardRequests(requests: RecordedRequest[]) {
  return requests.filter(({ url }) => url.pathname.endsWith("/bulk-discard"));
}

function discardedIds(requests: RecordedRequest[]) {
  return discardRequests(requests).map(
    ({ body }) => (JSON.parse(body ?? "{}") as { card_ids: string[] }).card_ids,
  );
}

describe("discardCards", () => {
  it("reads the given cards among the signed-in user's owned ones", async () => {
    const rows = entries(2);
    const { session, requests } = await collectionWith(rows);

    await discardCards(session, cardIds(rows));

    const params = requests.find(restRequest("GET", "user_cards"))?.url
      .searchParams;
    expect(params?.get("user_id")).toBe(`eq.${USER_ID}`);
    expect(params?.get("card_id")).toBe(`in.(${cardIds(rows).join(",")})`);
    expect(params?.get("count")).toBe("gt.0");
  });

  it("discards exactly the given cards by their collection entry", async () => {
    const [first, second] = pair();
    const { session, requests } = await collectionWith([
      first,
      second,
      entry(2),
    ]);

    const result = await discardCards(session, cardIds([second, first]));

    expect(discardedIds(requests).flat().sort()).toEqual([first.id, second.id]);
    expect(result).toEqual({
      discarded: 2,
      gained: 2,
      balance: INITIAL_BALANCE + 2,
      failed: [],
    });
  });

  it("discards any number of cards, 100 at a time, for 1 wikibidou each", async () => {
    const rows = entries(250);
    const { session, requests } = await collectionWith(rows);

    const result = await discardCards(session, cardIds(rows));

    const batches = discardedIds(requests);
    expect(batches.map((batch) => batch.length)).toEqual([100, 100, 50]);
    expect(batches.flat()).toEqual(rows.map(({ id }) => id));
    expect(result.discarded).toBe(250);
    expect(result.gained).toBe(250);
    expect(result.balance).toBe(INITIAL_BALANCE + 250);
  });

  it("discards a card given twice only once", async () => {
    const row = entry(0);
    const { session, requests } = await collectionWith([row]);

    await discardCards(session, cardIds([row, row]));

    expect(discardedIds(requests)).toEqual([[row.id]]);
  });

  it("refuses cards absent from the collection, naming them, and discards nothing", async () => {
    const [owned, absent] = pair();
    const { session, requests } = await collectionWith([owned]);

    const discard = discardCards(session, cardIds([owned, absent]));

    await expect(discard).rejects.toThrow(WikiMastersError);
    await expect(discard).rejects.toThrow(
      `Not in your collection: ${absent.card_id}; nothing was discarded`,
    );
    expect(discardRequests(requests)).toEqual([]);
  });

  it("names each card the game refused with the game's reason", async () => {
    const [refused, accepted] = pair();
    const reason = { id: refused.id, error: "Carte engagée dans un échange" };
    const { session } = await sessionWith(
      collectionSelect([refused, accepted]),
      bulkDiscard(() => [reason, "unknown failure"]),
    );

    const result = await discardCards(session, cardIds([refused, accepted]));

    expect(result.failed).toEqual([
      { cardId: refused.card_id, reason },
      { cardId: null, reason: "unknown failure" },
    ]);
  });

  it("authenticates the discard with the session cookie the site reads", async () => {
    const { session, requests } = await collectionWith(entries(1));

    await discardCards(session, cardIds(entries(1)));

    const [discard] = discardRequests(requests);
    const prefix = `${AUTH_COOKIE_NAME}=base64-`;
    const cookie = discard?.headers.get("cookie") ?? "";
    expect(cookie.startsWith(prefix)).toBe(true);
    const stored = JSON.parse(
      Buffer.from(cookie.slice(prefix.length), "base64url").toString("utf8"),
    );
    expect(stored.access_token).toBe(ACCESS_TOKEN);
  });

  it("tells how many cards were discarded before a batch failed", async () => {
    const discard = bulkDiscard();
    let calls = 0;
    const rows = entries(250);
    const { session } = await sessionWith(collectionSelect(rows), (request) =>
      request.url.pathname.endsWith("/bulk-discard") && ++calls === 3
        ? { status: 500, body: { error: "boom" } }
        : discard(request),
    );

    await expect(discardCards(session, cardIds(rows))).rejects.toThrow(
      /HTTP 500.*200 cards were discarded before the failure/,
    );
  });

  it("requires a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      collectionSelect(entries(1)),
      ({ url }) =>
        url.pathname.endsWith("/bulk-discard")
          ? { status: 401, body: { error: "Unauthorized" } }
          : undefined,
    );

    await expect(discardCards(session, cardIds(entries(1)))).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
