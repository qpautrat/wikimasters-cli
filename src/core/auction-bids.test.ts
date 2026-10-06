import { describe, expect, it } from "vitest";
import { listRunningBids } from "./auction-bids.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import {
  USER_ID,
  fakeFetch,
  restRequest,
  restRoute,
  tokenRefresh,
  type Route,
} from "./testing/fake-supabase.js";

const OTHER_BIDDER_ID = "8b2f61c4-0d7e-4a3b-9c55-1f6e2a9d7b30";
const SOON = "2026-10-06T08:56:58.649051+00:00";
const LATER = "2026-10-07T10:00:00+00:00";

function bid(
  auctionId: string,
  amount: number,
  auction: Record<string, unknown> = {},
) {
  return {
    auction_id: auctionId,
    amount,
    auctions: {
      end_at: SOON,
      current_bid: 25,
      current_bidder_id: USER_ID,
      cards: { wikipedia_title: "Pointe de la Sambuy" },
      ...auction,
    },
  };
}

function bidSelect(rows: unknown[]): Route {
  return restRoute("GET", "auction_bids", { status: 200, body: rows });
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
    const { session, requests } = await sessionWith(bidSelect([]));

    await listRunningBids(session);

    const select = requests.find(restRequest("GET", "auction_bids"));
    const params = select?.url.searchParams;
    expect(params?.get("select")).toBe(
      "auction_id,amount,auctions!inner(end_at,current_bid,current_bidder_id,cards(wikipedia_title))",
    );
    expect(params?.get("bidder_id")).toBe(`eq.${USER_ID}`);
    expect(params?.get("auctions.status")).toBe("eq.active");
    const endsAfter = params?.get("auctions.end_at") ?? "";
    expect(endsAfter).toMatch(/^gt\./);
    expect(Math.abs(Date.parse(endsAfter.slice(3)) - Date.now())).toBeLessThan(
      60_000,
    );
  });

  it("gives one line per auction with the user's highest bid", async () => {
    const auctionId = "578e5a64-fbb4-4b9c-b5b7-fdc57e8aa908";
    const { session } = await sessionWith(
      bidSelect([bid(auctionId, 16), bid(auctionId, 25), bid(auctionId, 20)]),
    );

    await expect(listRunningBids(session)).resolves.toEqual([
      {
        auctionId,
        title: "Pointe de la Sambuy",
        myHighestBid: 25,
        currentBid: 25,
        leading: true,
        endsAt: SOON,
      },
    ]);
  });

  it("tells when another player leads and sorts by end time, soonest first", async () => {
    const later = "11111111-1111-4111-8111-000000000001";
    const sooner = "11111111-1111-4111-8111-000000000002";
    const { session } = await sessionWith(
      bidSelect([
        bid(later, 30, {
          end_at: LATER,
          current_bid: 40,
          current_bidder_id: OTHER_BIDDER_ID,
          cards: { wikipedia_title: "Half Dome" },
        }),
        bid(sooner, 25),
      ]),
    );

    const auctions = await listRunningBids(session);

    expect(
      auctions.map(({ auctionId, leading }) => ({ auctionId, leading })),
    ).toEqual([
      { auctionId: sooner, leading: true },
      { auctionId: later, leading: false },
    ]);
  });

  it("returns an empty list when the user has no bid on a running auction", async () => {
    const { session } = await sessionWith(bidSelect([]));

    await expect(listRunningBids(session)).resolves.toEqual([]);
  });

  it("fails when an auctioned card cannot be read", async () => {
    const { session } = await sessionWith(
      bidSelect([
        bid("578e5a64-fbb4-4b9c-b5b7-fdc57e8aa908", 25, { cards: null }),
      ]),
    );

    await expect(listRunningBids(session)).rejects.toThrow(WikiMastersError);
  });

  it("asks to log in again on HTTP 401", async () => {
    const { session } = await sessionWith(
      restRoute("GET", "auction_bids", {
        status: 401,
        body: { message: "JWT expired" },
      }),
    );

    await expect(listRunningBids(session)).rejects.toThrow(AuthRequiredError);
  });
});
