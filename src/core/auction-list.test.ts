import { describe, expect, it } from "vitest";
import { listAuctions } from "./auction-list.js";
import { parseAuctionLimit } from "./auction.js";
import { WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import {
  USER_ID,
  fakeFetch,
  restRequest,
  restRoute,
  tokenRefresh,
  type FakeResponse,
} from "./testing/fake-supabase.js";

const AUCTION_ID = "d6669009-683d-44b6-b6e7-2c0960c37f2f";
const OTHER_AUCTION_ID = "e8b3484c-86c2-4b36-95d1-503cc61f0979";
const OTHER_PLAYER_ID = "4e795adc-61ec-4927-9a71-22a0ca69d08a";
const limit = parseAuctionLimit("50");

function auction(overrides: Record<string, unknown> = {}) {
  return {
    id: AUCTION_ID,
    status: "active",
    end_at: "2026-10-08T12:16:55.130404+00:00",
    seller_id: OTHER_PLAYER_ID,
    base_amount: 200,
    current_bid: 326,
    current_bidder_id: OTHER_PLAYER_ID,
    snapshot_rarity: "R",
    is_shiny: true,
    cards: { wikipedia_title: "Musique celtique" },
    ...overrides,
  };
}

async function sessionAnswering(response: FakeResponse) {
  const { fetch, requests } = fakeFetch(
    tokenRefresh,
    restRoute("GET", "auctions", response),
  );
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  const listRequest = () => requests.find(restRequest("GET", "auctions"));
  return { session, listRequest };
}

describe("listAuctions", () => {
  it("returns each auction's card, state, and the user's part in it, in the API's order", async () => {
    const first = auction();
    const second = auction({
      id: OTHER_AUCTION_ID,
      status: "settled_sold",
      seller_id: USER_ID,
      current_bid: null,
      current_bidder_id: null,
      snapshot_rarity: "L",
      is_shiny: false,
      cards: { wikipedia_title: "Lion" },
    });
    const { session } = await sessionAnswering({
      status: 200,
      body: [first, second],
    });

    await expect(listAuctions(session, {}, limit)).resolves.toEqual([
      {
        auctionId: AUCTION_ID,
        title: "Musique celtique",
        rarity: "R",
        shiny: true,
        status: "active",
        endsAt: first.end_at,
        startingPrice: 200,
        currentBid: 326,
        leading: false,
        selling: false,
      },
      {
        auctionId: OTHER_AUCTION_ID,
        title: "Lion",
        rarity: "L",
        shiny: false,
        status: "settled_sold",
        endsAt: second.end_at,
        startingPrice: 200,
        currentBid: null,
        leading: false,
        selling: true,
      },
    ]);
  });

  it("tells when the user leads an auction", async () => {
    const { session } = await sessionAnswering({
      status: 200,
      body: [auction({ current_bidder_id: USER_ID })],
    });

    const [listed] = await listAuctions(session, {}, limit);

    expect(listed?.leading).toBe(true);
  });

  it("reads every status at most the limit, in the API's order, without a status", async () => {
    const { session, listRequest } = await sessionAnswering({
      status: 200,
      body: [],
    });

    await listAuctions(session, {}, parseAuctionLimit("7"));

    const params = listRequest()?.url.searchParams;
    expect(params?.get("limit")).toBe("7");
    expect(params?.has("status")).toBe(false);
    expect(params?.has("order")).toBe(false);
  });

  it("passes the status to the API as given", async () => {
    const { session, listRequest } = await sessionAnswering({
      status: 200,
      body: [],
    });

    await expect(
      listAuctions(session, { status: "bogus" }, limit),
    ).resolves.toEqual([]);

    expect(listRequest()?.url.searchParams.get("status")).toBe("eq.bogus");
  });

  it("fails with the API's reason", async () => {
    const { session } = await sessionAnswering({
      status: 500,
      body: {
        code: "57014",
        message: "canceling statement due to statement timeout",
      },
    });

    const failure = listAuctions(session, {}, limit);
    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(
      /canceling statement due to statement timeout/,
    );
  });
});
