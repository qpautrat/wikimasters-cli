import { describe, expect, it } from "vitest";
import { listAuctions } from "./auction-list.js";
import { parseAuctionLimit } from "./auction.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import {
  USER_ID,
  fakeFetch,
  tokenRefresh,
  type FakeResponse,
  type RecordedRequest,
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
    card: { wikipedia_title: "Musique celtique" },
    ...overrides,
  };
}

function isList({ method, url }: RecordedRequest): boolean {
  return method === "GET" && url.pathname === "/api/marketplace";
}

async function sessionAnswering(response: FakeResponse) {
  const { fetch, requests } = fakeFetch(tokenRefresh, (request) =>
    isList(request) ? response : undefined,
  );
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  const listRequest = () => requests.find(isList);
  return { session, listRequest };
}

function marketplace(auctions: unknown[]): FakeResponse {
  return {
    status: 200,
    body: { auctions, page: 1, limit: 50, hasMore: false },
  };
}

describe("listAuctions", () => {
  it("returns each auction's card, state, and the user's part in it, in the API's order", async () => {
    const first = auction();
    const second = auction({
      id: OTHER_AUCTION_ID,
      seller_id: USER_ID,
      current_bid: null,
      current_bidder_id: null,
      snapshot_rarity: "L",
      is_shiny: false,
      card: { wikipedia_title: "Lion" },
    });
    const { session } = await sessionAnswering(marketplace([first, second]));

    await expect(listAuctions(session, limit)).resolves.toEqual([
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
        status: "active",
        endsAt: second.end_at,
        startingPrice: 200,
        currentBid: null,
        leading: false,
        selling: true,
      },
    ]);
  });

  it("tells when the user leads an auction", async () => {
    const { session } = await sessionAnswering(
      marketplace([auction({ current_bidder_id: USER_ID })]),
    );

    const [listed] = await listAuctions(session, limit);

    expect(listed?.leading).toBe(true);
  });

  it("asks the marketplace for the limit, with nothing else", async () => {
    const { session, listRequest } = await sessionAnswering(marketplace([]));

    await expect(
      listAuctions(session, parseAuctionLimit("7")),
    ).resolves.toEqual([]);

    const params = listRequest()?.url.searchParams;
    expect([...(params?.keys() ?? [])]).toEqual(["limit"]);
    expect(params?.get("limit")).toBe("7");
  });

  it("reports the reason the game gives for refusing an automated read", async () => {
    const { session } = await sessionAnswering({
      status: 403,
      body: {
        code: "automation_limit",
        error:
          "Trop de requêtes automatisées. L'automatisation n'est pas autorisée — voir le règlement.",
      },
    });

    const failure = listAuctions(session, limit);
    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(/HTTP 403/);
    await expect(failure).rejects.toThrow(/automation_limit/);
    await expect(failure).rejects.toThrow(/Trop de requêtes automatisées/);
  });

  it("asks to log in again on HTTP 401", async () => {
    const { session } = await sessionAnswering({
      status: 401,
      body: { error: "Unauthorized" },
    });

    await expect(listAuctions(session, limit)).rejects.toThrow(
      AuthRequiredError,
    );
  });

  it("fails on a response without auctions", async () => {
    const { session } = await sessionAnswering({ status: 200, body: {} });

    await expect(listAuctions(session, limit)).rejects.toThrow(
      /unexpected response/,
    );
  });
});
