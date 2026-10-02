import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { discardCommons } from "./collection.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import {
  ACCESS_TOKEN,
  USER_ID,
  fakeFetch,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";

const INITIAL_BALANCE = 7000;

function common(index: number) {
  const suffix = String(index).padStart(12, "0");
  return {
    id: `00000000-0000-4000-8000-${suffix}`,
    card_id: `11111111-1111-4111-8111-${suffix}`,
    snapshot_rarity: "C",
    starred: false,
    is_shiny: false,
  };
}

function commons(count: number) {
  return Array.from({ length: count }, (_, index) => common(index));
}

function collectionSelect(rows: unknown[]): Route {
  return ({ method, url }) => {
    if (method !== "GET" || url.pathname !== "/rest/v1/user_cards")
      return undefined;
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? rows.length);
    return { status: 200, body: rows.slice(offset, offset + limit) };
  };
}

function myCollection(pendingTradeCardIds: string[] = []): Route {
  return ({ method, url }) =>
    method === "GET" && url.pathname === "/api/my-collection"
      ? { status: 200, body: { collection: [], pendingTradeCardIds } }
      : undefined;
}

const profile: Route = ({ method, url }) =>
  method === "POST" && url.pathname === "/rest/v1/rpc/get_my_profile"
    ? { status: 200, body: { wikibidous_balance: INITIAL_BALANCE } }
    : undefined;

function bulkDiscard(): Route {
  let balance = INITIAL_BALANCE;
  return ({ method, url, body }) => {
    if (method !== "POST" || url.pathname !== "/api/user-cards/bulk-discard")
      return undefined;
    const { card_ids } = JSON.parse(body ?? "{}") as { card_ids: string[] };
    balance += card_ids.length;
    return {
      status: 200,
      body: { balance, discarded_count: card_ids.length, failed: [] },
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

function collectionWith(rows: unknown[], pendingTradeCardIds: string[] = []) {
  return sessionWith(
    collectionSelect(rows),
    myCollection(pendingTradeCardIds),
    profile,
    bulkDiscard(),
  );
}

function discardRequests(requests: RecordedRequest[]) {
  return requests.filter(({ url }) => url.pathname.endsWith("/bulk-discard"));
}

function discardedIds(requests: RecordedRequest[]) {
  return discardRequests(requests).map(
    ({ body }) => (JSON.parse(body ?? "{}") as { card_ids: string[] }).card_ids,
  );
}

describe("discardCommons", () => {
  it("selects only the plain common cards of the signed-in user", async () => {
    const { session, requests } = await collectionWith(commons(1));

    await discardCommons(session);

    const select = requests.find(({ url }) =>
      url.pathname.endsWith("/user_cards"),
    );
    const params = select?.url.searchParams;
    expect(params?.get("user_id")).toBe(`eq.${USER_ID}`);
    expect(params?.get("snapshot_rarity")).toBe("eq.C");
    expect(params?.get("starred")).toBe("is.false");
    expect(params?.get("is_shiny")).toBe("is.false");
    expect(params?.get("count")).toBe("gt.0");
  });

  it("discards every common across pages, 100 at a time, for 1 wikibidou each", async () => {
    const rows = commons(1003);
    const { session, requests } = await collectionWith(rows);

    const result = await discardCommons(session);

    const batches = discardedIds(requests);
    expect(batches.every((batch) => batch.length <= 100)).toBe(true);
    expect(batches.flat()).toEqual(rows.map(({ id }) => id));
    expect(result).toEqual({
      discarded: 1003,
      gained: 1003,
      balance: INITIAL_BALANCE + 1003,
      failed: [],
    });
  });

  it("keeps the cards engaged in a pending trade", async () => {
    const [byEntry, byCard, free] = commons(3);
    const { session, requests } = await collectionWith(
      [byEntry, byCard, free],
      [byEntry?.id ?? "", byCard?.card_id ?? ""],
    );

    await discardCommons(session);

    expect(discardedIds(requests).flat()).toEqual([free?.id]);
  });

  it("authenticates site requests with the session cookie the site reads", async () => {
    const { session, requests } = await collectionWith(commons(1));

    await discardCommons(session);

    const siteRequests = requests.filter(({ url }) =>
      url.pathname.startsWith("/api/"),
    );
    expect(siteRequests).toHaveLength(2);
    const prefix = `${AUTH_COOKIE_NAME}=base64-`;
    for (const { headers } of siteRequests) {
      const cookie = headers.get("cookie") ?? "";
      expect(cookie.startsWith(prefix)).toBe(true);
      const stored = JSON.parse(
        Buffer.from(cookie.slice(prefix.length), "base64url").toString("utf8"),
      );
      expect(stored.access_token).toBe(ACCESS_TOKEN);
    }
  });

  it("succeeds without discarding when there is no common card", async () => {
    const { session, requests } = await collectionWith([]);

    await expect(discardCommons(session)).resolves.toEqual({
      discarded: 0,
      gained: 0,
      balance: INITIAL_BALANCE,
      failed: [],
    });
    expect(discardRequests(requests)).toEqual([]);
  });

  it("discards nothing when a selected card is not a plain common", async () => {
    const { session, requests } = await collectionWith([
      common(0),
      { ...common(1), snapshot_rarity: "PC" },
    ]);

    await expect(discardCommons(session)).rejects.toThrow(WikiMastersError);
    expect(discardRequests(requests)).toEqual([]);
  });

  it("tells how many cards were discarded before a batch failed", async () => {
    const discard = bulkDiscard();
    let calls = 0;
    const { session } = await sessionWith(
      collectionSelect(commons(250)),
      myCollection(),
      (request) =>
        request.url.pathname.endsWith("/bulk-discard") && ++calls === 3
          ? { status: 500, body: { error: "boom" } }
          : discard(request),
    );

    await expect(discardCommons(session)).rejects.toThrow(
      /HTTP 500.*200 cards were discarded before the failure/,
    );
  });

  it("requires a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      collectionSelect(commons(1)),
      myCollection(),
      ({ url }) =>
        url.pathname.endsWith("/bulk-discard")
          ? { status: 401, body: { error: "Unauthorized" } }
          : undefined,
    );

    await expect(discardCommons(session)).rejects.toThrow(AuthRequiredError);
  });
});
