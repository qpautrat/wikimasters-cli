import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { discardEntries } from "./collection.js";
import { asEntryId, type EntryId } from "./entry-id.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import {
  ACCESS_TOKEN,
  fakeFetch,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";

const INITIAL_BALANCE = 7000;

function entryId(index: number): EntryId {
  return asEntryId(
    `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  );
}

function entryIds(count: number): EntryId[] {
  return Array.from({ length: count }, (_, index) => entryId(index));
}

function bulkDiscard(failed: (ids: string[]) => unknown[] = () => []): Route {
  return ({ method, url, body }) => {
    if (method !== "POST" || url.pathname !== "/api/user-cards/bulk-discard")
      return undefined;
    const { card_ids } = JSON.parse(body ?? "{}") as { card_ids: string[] };
    const refused = failed(card_ids);
    const count = card_ids.length - refused.length;
    return {
      status: 200,
      body: {
        balance: INITIAL_BALANCE + count,
        discarded_count: count,
        failed: refused,
      },
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

function siteRequests(requests: RecordedRequest[]) {
  return requests.filter(({ url }) => url.pathname.startsWith("/api/"));
}

function restRequests(requests: RecordedRequest[]) {
  return requests.filter(({ url }) => url.pathname.startsWith("/rest/"));
}

function discardedIds(requests: RecordedRequest[]) {
  return siteRequests(requests).map(
    ({ body }) => (JSON.parse(body ?? "{}") as { card_ids: string[] }).card_ids,
  );
}

describe("discardEntries", () => {
  it("sends the given entries as given in a single request, without reading the collection", async () => {
    const ids = [entryId(1), entryId(0)];
    const { session, requests } = await sessionWith(bulkDiscard());

    await discardEntries(session, ids);

    expect(discardedIds(requests)).toEqual([ids]);
    expect(restRequests(requests)).toEqual([]);
  });

  it("sends more than 100 entries in the same request", async () => {
    const ids = entryIds(150);
    const { session, requests } = await sessionWith(bulkDiscard());

    await discardEntries(session, ids);

    expect(discardedIds(requests)).toEqual([ids]);
  });

  it("reports the count, the gain of 1 wikibidou each and the balance", async () => {
    const { session } = await sessionWith(bulkDiscard());

    const result = await discardEntries(session, entryIds(2));

    expect(result).toEqual({
      discarded: 2,
      gained: 2,
      balance: INITIAL_BALANCE + 2,
      failed: [],
    });
  });

  it("names each entry the game refused with the game's reason", async () => {
    const [refused, accepted] = entryIds(2) as [EntryId, EntryId];
    const { session } = await sessionWith(
      bulkDiscard(() => [{ card_id: refused, error: "card_not_owned" }]),
    );

    const result = await discardEntries(session, [refused, accepted]);

    expect(result.discarded).toBe(1);
    expect(result.failed).toEqual([
      { entryId: refused, reason: "card_not_owned" },
    ]);
  });

  it("fails with the game's reason when it refuses the whole request", async () => {
    const { session } = await sessionWith(() => ({
      status: 400,
      body: { error: "Maximum 100 cartes par requête" },
    }));

    const discard = discardEntries(session, entryIds(101));

    await expect(discard).rejects.toThrow(WikiMastersError);
    await expect(discard).rejects.toThrow(
      /HTTP 400.*Maximum 100 cartes par requête/,
    );
  });

  it("refuses an empty list without sending anything", async () => {
    const { session, requests } = await sessionWith(bulkDiscard());

    await expect(discardEntries(session, [])).rejects.toThrow(
      "No entry to discard was given",
    );
    expect(siteRequests(requests)).toEqual([]);
  });

  it.each([
    ["counts fewer entries than sent", { discarded_count: 2, failed: [] }],
    [
      "refuses an entry it was not sent",
      {
        discarded_count: 2,
        failed: [{ card_id: entryId(9), error: "card_not_owned" }],
      },
    ],
    [
      "gives a refusal without an error code",
      { discarded_count: 2, failed: [{ card_id: entryId(0) }] },
    ],
  ])("fails when the game %s", async (_, response) => {
    const { session } = await sessionWith(() => ({
      status: 200,
      body: { balance: INITIAL_BALANCE + 2, ...response },
    }));

    await expect(discardEntries(session, entryIds(3))).rejects.toThrow(
      /unexpected response, which may have discarded some of the 3 entries sent/,
    );
  });

  it("authenticates the discard with the session cookie the site reads", async () => {
    const { session, requests } = await sessionWith(bulkDiscard());

    await discardEntries(session, entryIds(1));

    const [discard] = siteRequests(requests);
    const prefix = `${AUTH_COOKIE_NAME}=base64-`;
    const cookie = discard?.headers.get("cookie") ?? "";
    expect(cookie.startsWith(prefix)).toBe(true);
    const stored = JSON.parse(
      Buffer.from(cookie.slice(prefix.length), "base64url").toString("utf8"),
    );
    expect(stored.access_token).toBe(ACCESS_TOKEN);
  });

  it("requires a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(({ url }) =>
      url.pathname.endsWith("/bulk-discard")
        ? { status: 401, body: { error: "Unauthorized" } }
        : undefined,
    );

    await expect(discardEntries(session, entryIds(1))).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
