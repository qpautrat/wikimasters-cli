import { describe, expect, it } from "vitest";
import { listRunningBids } from "./auction-bids.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { parsePageLimit, parsePageNumber } from "./page.js";
import { resumeSession } from "./session.js";
import {
  USER_ID,
  fakeFetch,
  pagedRestRead,
  restRequest,
  restRoute,
  tokenRefresh,
  type Route,
} from "./testing/fake-supabase.js";

const OTHER_BIDDER_ID = "8b2f61c4-0d7e-4a3b-9c55-1f6e2a9d7b30";
const PLACED = "2026-10-05T18:00:00.123456+00:00";
const AUCTION_ID = "578e5a64-fbb4-4b9c-b5b7-fdc57e8aa908";

const firstPage = {
  page: parsePageNumber("1"),
  limit: parsePageLimit("1000"),
};

const AFTER_NOW = new Date(Date.now() + 3_600_000).toISOString();
const LATER = new Date(Date.now() + 7_200_000).toISOString();
const BEFORE_NOW = new Date(Date.now() - 3_600_000).toISOString();

function bid(auctionId: string, amount: number) {
  return { auction_id: auctionId, amount, placed_at: PLACED };
}

function auction(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    status: "active",
    end_at: AFTER_NOW,
    seller_id: OTHER_BIDDER_ID,
    base_amount: 10,
    current_bid: 25,
    current_bidder_id: USER_ID,
    card: { wikipedia_title: "Pointe de la Sambuy" },
    ...overrides,
  };
}

function auctionReads(...auctions: Array<ReturnType<typeof auction>>): {
  route: Route;
  reads: string[];
} {
  const reads: string[] = [];
  const route: Route = ({ method, url }) => {
    const id = url.pathname.replace("/api/marketplace/", "");
    const found = auctions.find((candidate) => candidate.id === id);
    if (method !== "GET" || !found) return undefined;
    reads.push(id);
    return { status: 200, body: { auction: found, bids: [] } };
  };
  return { route, reads };
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

describe("listRunningBids", () => {
  it("reads the user's bids, paged, without joining the auctions", async () => {
    const { session, requests } = await sessionWith(
      pagedRestRead("auction_bids", []),
    );

    await listRunningBids(session, firstPage);

    const params = requests.find(restRequest("GET", "auction_bids"))?.url
      .searchParams;
    expect(params?.get("select")).toBe("auction_id,amount,placed_at");
    expect(params?.get("bidder_id")).toBe(`eq.${USER_ID}`);
    expect(params?.get("order")).toBe("placed_at.asc,id.asc");
    expect(requests.filter(restRequest("GET", "auctions"))).toHaveLength(0);
  });

  it("gives one line per bid, in the order the game returns them", async () => {
    const other = "11111111-1111-4111-8111-000000000001";
    const { route } = auctionReads(
      auction(AUCTION_ID),
      auction(other, {
        end_at: LATER,
        current_bid: 40,
        current_bidder_id: OTHER_BIDDER_ID,
        card: { wikipedia_title: "Half Dome" },
      }),
    );
    const { session } = await sessionWith(
      pagedRestRead("auction_bids", [
        bid(AUCTION_ID, 25),
        bid(AUCTION_ID, 16),
        bid(other, 30),
      ]),
      route,
    );

    const { bids } = await listRunningBids(session, firstPage);

    expect(bids).toEqual([
      {
        auctionId: AUCTION_ID,
        title: "Pointe de la Sambuy",
        amount: 25,
        placedAt: PLACED,
        currentBid: 25,
        leading: true,
        endsAt: AFTER_NOW,
      },
      expect.objectContaining({ auctionId: AUCTION_ID, amount: 16 }),
      expect.objectContaining({
        auctionId: other,
        title: "Half Dome",
        leading: false,
        endsAt: LATER,
      }),
    ]);
  });

  it("reads each auction once, however many bids the user placed on it", async () => {
    const { route, reads } = auctionReads(auction(AUCTION_ID));
    const { session } = await sessionWith(
      pagedRestRead("auction_bids", [bid(AUCTION_ID, 25), bid(AUCTION_ID, 16)]),
      route,
    );

    await listRunningBids(session, firstPage);

    expect(reads).toEqual([AUCTION_ID]);
  });

  it("leaves out the bids on auctions that are not running", async () => {
    const settled = "11111111-1111-4111-8111-000000000002";
    const overdue = "11111111-1111-4111-8111-000000000003";
    const { route } = auctionReads(
      auction(AUCTION_ID),
      auction(settled, { status: "settled_sold" }),
      auction(overdue, { end_at: BEFORE_NOW }),
    );
    const { session } = await sessionWith(
      pagedRestRead("auction_bids", [
        bid(settled, 5),
        bid(overdue, 6),
        bid(AUCTION_ID, 7),
      ]),
      route,
    );

    const { bids } = await listRunningBids(session, firstPage);

    expect(bids.map(({ auctionId }) => auctionId)).toEqual([AUCTION_ID]);
  });

  it("reads the requested page of bids", async () => {
    const rows = Array.from({ length: 7 }, (_, index) =>
      bid(AUCTION_ID, index + 1),
    );
    const { route } = auctionReads(auction(AUCTION_ID));
    const { session, requests } = await sessionWith(
      pagedRestRead("auction_bids", rows),
      route,
    );

    const { bids } = await listRunningBids(session, {
      page: parsePageNumber("2"),
      limit: parsePageLimit("3"),
    });

    expect(bids.map(({ amount }) => amount)).toEqual([4, 5, 6]);
    const reads = requests.filter(restRequest("GET", "auction_bids"));
    expect(reads).toHaveLength(1);
    expect(reads[0]?.url.searchParams.get("offset")).toBe("3");
    expect(reads[0]?.url.searchParams.get("limit")).toBe("3");
  });

  it("says whether the page holds as many bids as requested, running or not", async () => {
    const ended = "11111111-1111-4111-8111-000000000002";
    const { route } = auctionReads(
      auction(ended, { status: "settled_unsold" }),
    );
    const { session } = await sessionWith(
      pagedRestRead("auction_bids", [bid(ended, 1), bid(ended, 2)]),
      route,
    );

    const twoPerPage = {
      page: parsePageNumber("1"),
      limit: parsePageLimit("2"),
    };
    const threePerPage = { ...twoPerPage, limit: parsePageLimit("3") };
    await expect(listRunningBids(session, twoPerPage)).resolves.toEqual({
      bids: [],
      full: true,
    });
    await expect(listRunningBids(session, threePerPage)).resolves.toMatchObject(
      { full: false },
    );
  });

  it("returns an empty page when the user has no bid", async () => {
    const { session, requests } = await sessionWith(
      pagedRestRead("auction_bids", []),
    );

    await expect(listRunningBids(session, firstPage)).resolves.toEqual({
      bids: [],
      full: false,
    });
    expect(
      requests.filter(({ url }) => url.pathname.startsWith("/api/marketplace")),
    ).toHaveLength(0);
  });

  it("fails when an auctioned card cannot be read", async () => {
    const { route } = auctionReads(auction(AUCTION_ID, { card: null }));
    const { session } = await sessionWith(
      pagedRestRead("auction_bids", [bid(AUCTION_ID, 25)]),
      route,
    );

    await expect(listRunningBids(session, firstPage)).rejects.toThrow(
      WikiMastersError,
    );
  });

  it("reports the reason the game gives for refusing an automated read", async () => {
    const { session } = await sessionWith(
      pagedRestRead("auction_bids", [bid(AUCTION_ID, 25)]),
      ({ url }) =>
        url.pathname === `/api/marketplace/${AUCTION_ID}`
          ? {
              status: 403,
              body: { code: "automation_limit", error: "Trop de requêtes" },
            }
          : undefined,
    );

    await expect(listRunningBids(session, firstPage)).rejects.toThrow(
      /automation_limit/,
    );
  });

  it("asks to log in again on HTTP 401", async () => {
    const { session } = await sessionWith(
      restRoute("GET", "auction_bids", {
        status: 401,
        body: { message: "JWT expired" },
      }),
    );

    await expect(listRunningBids(session, firstPage)).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
