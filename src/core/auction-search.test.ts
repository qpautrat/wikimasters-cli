import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { searchAuctions } from "./auction-search.js";
import { parseAuctionLimit } from "./auction.js";
import { WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import {
  USER_ID,
  fakeFetch,
  tokenRefresh,
  type FakeResponse,
  type RecordedRequest,
} from "./testing/fake-supabase.js";

const AUCTION_ID = "5c214da4-d9ae-4222-9803-052554994ed6";
const OTHER_AUCTION_ID = "be8fea60-405b-416b-becc-a270992de0fd";
const OTHER_PLAYER_ID = "de78c800-d3b9-4942-a26d-e7942441aa72";
const limit = parseAuctionLimit("50");

function found(overrides: Record<string, unknown> = {}) {
  return {
    id: AUCTION_ID,
    seller_id: OTHER_PLAYER_ID,
    card_id: "25652952-d9fc-4787-b1b0-b7d9ce91b8a4",
    base_amount: 5,
    current_bid: 15,
    current_bidder_id: OTHER_PLAYER_ID,
    end_at: "2026-10-08T13:04:45.135909+00:00",
    status: "active",
    snapshot_rarity: "SR",
    is_shiny: false,
    card: { wikipedia_title: "Croix celtique", rarity: "SR" },
    owned: false,
    ...overrides,
  };
}

function isSearch({ method, url }: RecordedRequest): boolean {
  return method === "GET" && url.pathname === "/api/marketplace";
}

async function sessionAnswering(response: FakeResponse) {
  const { fetch, requests } = fakeFetch(tokenRefresh, (request) =>
    isSearch(request) ? response : undefined,
  );
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  const searchRequest = () => requests.find(isSearch);
  return { session, searchRequest };
}

describe("searchAuctions", () => {
  it("returns the auctions the game finds, in its order, with the user's part in them", async () => {
    const first = found();
    const second = found({
      id: OTHER_AUCTION_ID,
      seller_id: USER_ID,
      base_amount: 100,
      current_bid: null,
      current_bidder_id: null,
      is_shiny: true,
      card: { wikipedia_title: "Ankou" },
    });
    const { session } = await sessionAnswering({
      status: 200,
      body: { auctions: [first, second], page: 1, limit: 50, hasMore: false },
    });

    await expect(searchAuctions(session, "celtique", limit)).resolves.toEqual({
      auctions: [
        {
          auctionId: AUCTION_ID,
          title: "Croix celtique",
          rarity: "SR",
          shiny: false,
          status: "active",
          endsAt: first.end_at,
          startingPrice: 5,
          currentBid: 15,
          leading: false,
          selling: false,
        },
        {
          auctionId: OTHER_AUCTION_ID,
          title: "Ankou",
          rarity: "SR",
          shiny: true,
          status: "active",
          endsAt: second.end_at,
          startingPrice: 100,
          currentBid: null,
          leading: false,
          selling: true,
        },
      ],
      truncated: false,
    });
  });

  it("tells when the user leads a found auction", async () => {
    const { session } = await sessionAnswering({
      status: 200,
      body: {
        auctions: [found({ current_bidder_id: USER_ID })],
        hasMore: false,
      },
    });

    const {
      auctions: [listed],
    } = await searchAuctions(session, "celtique", limit);

    expect(listed?.leading).toBe(true);
  });

  it("sends the text trimmed, with the limit and the interface's default sort", async () => {
    const { session, searchRequest } = await sessionAnswering({
      status: 200,
      body: { auctions: [], hasMore: false },
    });

    await searchAuctions(session, "Genre musical & co", parseAuctionLimit("7"));

    const request = searchRequest();
    expect(Object.fromEntries(request?.url.searchParams ?? [])).toEqual({
      q: "Genre musical & co",
      page: "1",
      limit: "7",
      sort: "recent",
    });
    expect(request?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("leaves the text out when it is blank, as the interface does", async () => {
    const { session, searchRequest } = await sessionAnswering({
      status: 200,
      body: { auctions: [], hasMore: false },
    });

    await searchAuctions(session, "  ", limit);

    expect(searchRequest()?.url.searchParams.has("q")).toBe(false);
  });

  it("reports when the game says more auctions match", async () => {
    const { session } = await sessionAnswering({
      status: 200,
      body: { auctions: [found()], hasMore: true },
    });

    await expect(
      searchAuctions(session, "celtique", parseAuctionLimit("1")),
    ).resolves.toMatchObject({ truncated: true });
  });

  it("returns no auction when nothing matches", async () => {
    const { session } = await sessionAnswering({
      status: 200,
      body: { auctions: [], page: 1, limit: 50, hasMore: false },
    });

    await expect(searchAuctions(session, "zzz", limit)).resolves.toEqual({
      auctions: [],
      truncated: false,
    });
  });

  it("fails with the game's reason", async () => {
    const { session } = await sessionAnswering({
      status: 403,
      body: {
        code: "automation_limit",
        error: "Trop de requêtes automatisées.",
      },
    });

    const failure = searchAuctions(session, "celtique", limit);
    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(/automation_limit/);
  });

  it("fails on an unexpected response", async () => {
    const { session } = await sessionAnswering({
      status: 200,
      body: { auctions: [] },
    });

    await expect(searchAuctions(session, "celtique", limit)).rejects.toThrow(
      /unexpected response/,
    );
  });
});
