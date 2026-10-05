import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import {
  minimumBid,
  parseAuctionId,
  placeMinimumBid,
  showAuction,
} from "./auction.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import {
  USER_ID,
  fakeFetch,
  restRequest,
  restRoute,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";

const auctionId = parseAuctionId("d6669009-683d-44b6-b6e7-2c0960c37f2f");
const SELLER_ID = "4e795adc-61ec-4927-9a71-22a0ca69d08a";
const BIDDER_ID = "8b2f61c4-0d7e-4a3b-9c55-1f6e2a9d7b30";
const BALANCE_AFTER_BID = 7743;

function auction(overrides: Record<string, unknown> = {}) {
  return {
    status: "active",
    end_at: new Date(Date.now() + 3_600_000).toISOString(),
    seller_id: SELLER_ID,
    base_amount: 200,
    current_bid: 326,
    current_bidder_id: BIDDER_ID,
    snapshot_rarity: "R",
    is_shiny: true,
    cards: { wikipedia_title: "Musique celtique" },
    ...overrides,
  };
}

function auctionSelect(rows: unknown[]): Route {
  return restRoute("GET", "auctions", { status: 200, body: rows });
}

function bidRoute(
  response: (amount: number) => { status: number; body: unknown },
): Route {
  return ({ method, url, body }) => {
    if (
      method !== "POST" ||
      url.pathname !== `/api/marketplace/${auctionId}/bid`
    )
      return undefined;
    const { amount } = JSON.parse(body ?? "{}") as { amount: number };
    return response(amount);
  };
}

const acceptBid = bidRoute((amount) => ({
  status: 200,
  body: {
    auction_id: auctionId,
    current_bid: amount,
    bidder_balance: BALANCE_AFTER_BID,
  },
}));

async function sessionWith(...routes: Route[]) {
  const { fetch, requests } = fakeFetch(tokenRefresh, ...routes);
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  return { session, requests };
}

function bidRequests(requests: RecordedRequest[]) {
  return requests.filter(({ url }) => url.pathname.endsWith("/bid"));
}

describe("minimumBid", () => {
  it("is the base amount while nobody has bid", () => {
    expect(minimumBid({ base_amount: 200, current_bid: null })).toBe(200);
  });

  it("is the current bid plus 10%, rounded up as the site does", () => {
    expect(minimumBid({ base_amount: 200, current_bid: 200 })).toBe(221);
    expect(minimumBid({ base_amount: 200, current_bid: 244 })).toBe(269);
    expect(minimumBid({ base_amount: 200, current_bid: 326 })).toBe(359);
  });

  it("is at least one more than the current bid", () => {
    expect(minimumBid({ base_amount: 0, current_bid: 0 })).toBe(1);
  });
});

describe("placeMinimumBid", () => {
  it("bids the minimum on the auction and returns the new balance", async () => {
    const { session, requests } = await sessionWith(
      auctionSelect([auction()]),
      acceptBid,
    );

    await expect(placeMinimumBid(session, auctionId)).resolves.toEqual({
      auctionId,
      amount: 359,
      balance: BALANCE_AFTER_BID,
    });

    const select = requests.find(restRequest("GET", "auctions"));
    expect(select?.url.searchParams.get("id")).toBe(`eq.${auctionId}`);
    const [bid] = bidRequests(requests);
    expect(JSON.parse(bid?.body ?? "{}")).toEqual({ amount: 359 });
    expect(bid?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("reports the amount the site records", async () => {
    const { session } = await sessionWith(
      auctionSelect([auction()]),
      bidRoute(() => ({
        status: 200,
        body: { current_bid: 360, bidder_balance: BALANCE_AFTER_BID },
      })),
    );

    const { amount } = await placeMinimumBid(session, auctionId);

    expect(amount).toBe(360);
  });

  it("bids the base amount when nobody has bid yet", async () => {
    const { session, requests } = await sessionWith(
      auctionSelect([auction({ current_bid: null })]),
      acceptBid,
    );

    await placeMinimumBid(session, auctionId);

    expect(JSON.parse(bidRequests(requests)[0]?.body ?? "{}")).toEqual({
      amount: 200,
    });
  });

  it.each([
    ["settled", auction({ status: "settled_sold" })],
    [
      "past its end",
      auction({ end_at: new Date(Date.now() - 1000).toISOString() }),
    ],
  ])("refuses an auction %s without bidding", async (_, row) => {
    const { session, requests } = await sessionWith(
      auctionSelect([row]),
      acceptBid,
    );

    await expect(placeMinimumBid(session, auctionId)).rejects.toThrow(
      /no longer running/,
    );
    expect(bidRequests(requests)).toHaveLength(0);
  });

  it("outbids the user's own lead", async () => {
    const { session, requests } = await sessionWith(
      auctionSelect([auction({ current_bidder_id: USER_ID })]),
      acceptBid,
    );

    await placeMinimumBid(session, auctionId);

    expect(JSON.parse(bidRequests(requests)[0]?.body ?? "{}")).toEqual({
      amount: 359,
    });
  });

  it("refuses to bid on the user's own auction", async () => {
    const { session, requests } = await sessionWith(
      auctionSelect([auction({ seller_id: USER_ID })]),
      acceptBid,
    );

    await expect(placeMinimumBid(session, auctionId)).rejects.toThrow(
      /is yours/,
    );
    expect(bidRequests(requests)).toHaveLength(0);
  });

  it("fails on an unknown auction", async () => {
    const { session } = await sessionWith(auctionSelect([]), acceptBid);

    await expect(placeMinimumBid(session, auctionId)).rejects.toThrow(
      `Auction ${auctionId} not found`,
    );
  });

  it("reports the reason the site gives for refusing the bid", async () => {
    const { session } = await sessionWith(
      auctionSelect([auction()]),
      bidRoute(() => ({
        status: 400,
        body: { error: "Solde insuffisant", code: "insufficient_balance" },
      })),
    );

    const failure = placeMinimumBid(session, auctionId);
    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(/insufficient_balance/);
  });

  it("asks for a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      auctionSelect([auction()]),
      bidRoute(() => ({ status: 401, body: { error: "Unauthorized" } })),
    );

    await expect(placeMinimumBid(session, auctionId)).rejects.toThrow(
      AuthRequiredError,
    );
  });
});

describe("showAuction", () => {
  it("returns the auctioned copy, the bids and the minimum bid", async () => {
    const row = auction();
    const { session, requests } = await sessionWith(auctionSelect([row]));

    await expect(showAuction(session, auctionId)).resolves.toEqual({
      auctionId,
      title: "Musique celtique",
      rarity: "R",
      shiny: true,
      status: "active",
      endsAt: row.end_at,
      startingPrice: 200,
      currentBid: 326,
      leading: false,
      selling: false,
      minimumBid: 359,
    });
    const select = requests.find(restRequest("GET", "auctions"));
    expect(select?.url.searchParams.get("id")).toBe(`eq.${auctionId}`);
    expect(select?.url.searchParams.get("select")).toBe(
      "status,end_at,seller_id,base_amount,current_bid,current_bidder_id,snapshot_rarity,is_shiny,cards(wikipedia_title)",
    );
  });

  it("tells when the user leads the auction", async () => {
    const { session } = await sessionWith(
      auctionSelect([auction({ current_bidder_id: USER_ID })]),
    );

    const { leading, selling } = await showAuction(session, auctionId);

    expect({ leading, selling }).toEqual({ leading: true, selling: false });
  });

  it("tells when the user sells the auctioned card", async () => {
    const { session } = await sessionWith(
      auctionSelect([auction({ seller_id: USER_ID })]),
    );

    await expect(showAuction(session, auctionId)).resolves.toMatchObject({
      selling: true,
    });
  });

  it("reports no bid and the starting price as minimum while nobody has bid", async () => {
    const { session } = await sessionWith(
      auctionSelect([auction({ current_bid: null, current_bidder_id: null })]),
    );

    await expect(showAuction(session, auctionId)).resolves.toMatchObject({
      currentBid: null,
      leading: false,
      minimumBid: 200,
    });
  });

  it("fails when the auctioned card cannot be read", async () => {
    const { session } = await sessionWith(
      auctionSelect([auction({ cards: null })]),
    );

    await expect(showAuction(session, auctionId)).rejects.toThrow(
      new WikiMastersError(`Auction ${auctionId} has no readable card details`),
    );
  });

  it("fails on an unknown auction", async () => {
    const { session } = await sessionWith(auctionSelect([]));

    await expect(showAuction(session, auctionId)).rejects.toThrow(
      `Auction ${auctionId} not found`,
    );
  });
});

describe("parseAuctionId", () => {
  it("normalises a UUID", () => {
    expect(parseAuctionId(" D6669009-683D-44B6-B6E7-2C0960C37F2F ")).toBe(
      auctionId,
    );
  });

  it("rejects anything else", () => {
    expect(() => parseAuctionId("Cervin")).toThrow(WikiMastersError);
  });
});
