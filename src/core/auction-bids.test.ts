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
const SOON = "2026-10-06T08:56:58.649051+00:00";
const LATER = "2026-10-07T10:00:00+00:00";
const PLACED = "2026-10-05T18:00:00.123456+00:00";
const AUCTION_ID = "578e5a64-fbb4-4b9c-b5b7-fdc57e8aa908";

const firstPage = {
  page: parsePageNumber("1"),
  limit: parsePageLimit("1000"),
};

function bid(
  auctionId: string,
  amount: number,
  auction: Record<string, unknown> = {},
) {
  return {
    auction_id: auctionId,
    amount,
    placed_at: PLACED,
    auctions: {
      end_at: SOON,
      current_bid: 25,
      current_bidder_id: USER_ID,
      cards: { wikipedia_title: "Pointe de la Sambuy" },
      ...auction,
    },
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

describe("listRunningBids", () => {
  it("reads the user's bids on running auctions only", async () => {
    const { session, requests } = await sessionWith(
      pagedRestRead("auction_bids", []),
    );

    await listRunningBids(session, firstPage);

    const select = requests.find(restRequest("GET", "auction_bids"));
    const params = select?.url.searchParams;
    expect(params?.get("select")).toBe(
      "auction_id,amount,placed_at,auctions!inner(end_at,current_bid,current_bidder_id,cards(wikipedia_title))",
    );
    expect(params?.get("bidder_id")).toBe(`eq.${USER_ID}`);
    expect(params?.get("order")).toBe("placed_at.asc,id.asc");
    expect(params?.get("auctions.status")).toBe("eq.active");
    const endsAfter = params?.get("auctions.end_at") ?? "";
    expect(endsAfter).toMatch(/^gt\./);
    expect(Math.abs(Date.parse(endsAfter.slice(3)) - Date.now())).toBeLessThan(
      60_000,
    );
  });

  it("gives one line per bid, in the order the game returns them", async () => {
    const { session } = await sessionWith(
      pagedRestRead("auction_bids", [
        bid(AUCTION_ID, 25),
        bid(AUCTION_ID, 16),
        bid("11111111-1111-4111-8111-000000000001", 30, {
          end_at: LATER,
          current_bid: 40,
          current_bidder_id: OTHER_BIDDER_ID,
          cards: { wikipedia_title: "Half Dome" },
        }),
      ]),
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
        endsAt: SOON,
      },
      expect.objectContaining({ auctionId: AUCTION_ID, amount: 16 }),
      expect.objectContaining({
        auctionId: "11111111-1111-4111-8111-000000000001",
        title: "Half Dome",
        leading: false,
        endsAt: LATER,
      }),
    ]);
  });

  it("reads the requested page in a single request", async () => {
    const rows = Array.from({ length: 7 }, (_, index) =>
      bid(AUCTION_ID, index + 1),
    );
    const { session, requests } = await sessionWith(
      pagedRestRead("auction_bids", rows),
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

  it("says whether the page holds as many bids as requested", async () => {
    const rows = [bid(AUCTION_ID, 1), bid(AUCTION_ID, 2)];
    const { session } = await sessionWith(pagedRestRead("auction_bids", rows));

    const twoPerPage = {
      page: parsePageNumber("1"),
      limit: parsePageLimit("2"),
    };
    const threePerPage = { ...twoPerPage, limit: parsePageLimit("3") };
    await expect(listRunningBids(session, twoPerPage)).resolves.toMatchObject({
      full: true,
    });
    await expect(listRunningBids(session, threePerPage)).resolves.toMatchObject(
      { full: false },
    );
  });

  it("returns an empty page when the user has no bid on a running auction", async () => {
    const { session } = await sessionWith(pagedRestRead("auction_bids", []));

    await expect(listRunningBids(session, firstPage)).resolves.toEqual({
      bids: [],
      full: false,
    });
  });

  it("fails when an auctioned card cannot be read", async () => {
    const { session } = await sessionWith(
      pagedRestRead("auction_bids", [bid(AUCTION_ID, 25, { cards: null })]),
    );

    await expect(listRunningBids(session, firstPage)).rejects.toThrow(
      WikiMastersError,
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
