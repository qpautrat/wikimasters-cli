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
const REWARD_PER_CARD = 2;

function common(index: number) {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
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
    balance += REWARD_PER_CARD * card_ids.length;
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
    const { session, requests } = await sessionWith(
      collectionSelect(commons(1)),
      profile,
      bulkDiscard(),
    );

    await discardCommons(session);

    const select = requests.find(({ method }) => method === "GET");
    const params = select?.url.searchParams;
    expect(params?.get("user_id")).toBe(`eq.${USER_ID}`);
    expect(params?.get("snapshot_rarity")).toBe("eq.C");
    expect(params?.get("starred")).toBe("is.false");
    expect(params?.get("is_shiny")).toBe("is.false");
    expect(params?.get("count")).toBe("gt.0");
  });

  it("discards every common across pages, 50 at a time, and reports the gain", async () => {
    const rows = commons(1003);
    const { session, requests } = await sessionWith(
      collectionSelect(rows),
      profile,
      bulkDiscard(),
    );

    const result = await discardCommons(session);

    const batches = discardedIds(requests);
    expect(batches.every((batch) => batch.length <= 50)).toBe(true);
    expect(batches.flat()).toEqual(rows.map(({ id }) => id));
    expect(result).toEqual({
      discarded: 1003,
      gained: 1003 * REWARD_PER_CARD,
      balance: INITIAL_BALANCE + 1003 * REWARD_PER_CARD,
      failed: [],
    });
  });

  it("authenticates the discard with the session cookie the site reads", async () => {
    const { session, requests } = await sessionWith(
      collectionSelect(commons(1)),
      profile,
      bulkDiscard(),
    );

    await discardCommons(session);

    const cookie = discardRequests(requests)[0]?.headers.get("cookie") ?? "";
    const prefix = `${AUTH_COOKIE_NAME}=base64-`;
    expect(cookie.startsWith(prefix)).toBe(true);
    const stored = JSON.parse(
      Buffer.from(cookie.slice(prefix.length), "base64url").toString("utf8"),
    );
    expect(stored.access_token).toBe(ACCESS_TOKEN);
  });

  it("succeeds without discarding when there is no common card", async () => {
    const { session, requests } = await sessionWith(
      collectionSelect([]),
      profile,
      bulkDiscard(),
    );

    await expect(discardCommons(session)).resolves.toEqual({
      discarded: 0,
      gained: 0,
      balance: INITIAL_BALANCE,
      failed: [],
    });
    expect(discardRequests(requests)).toEqual([]);
  });

  it("discards nothing when a selected card is not a plain common", async () => {
    const { session, requests } = await sessionWith(
      collectionSelect([common(0), { ...common(1), snapshot_rarity: "PC" }]),
      profile,
      bulkDiscard(),
    );

    await expect(discardCommons(session)).rejects.toThrow(WikiMastersError);
    expect(discardRequests(requests)).toEqual([]);
  });

  it("requires a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      collectionSelect(commons(1)),
      profile,
      ({ url }) =>
        url.pathname.endsWith("/bulk-discard")
          ? { status: 401, body: { error: "Unauthorized" } }
          : undefined,
    );

    await expect(discardCommons(session)).rejects.toThrow(AuthRequiredError);
  });
});
