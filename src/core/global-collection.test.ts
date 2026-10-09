import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { WikiMastersError } from "./errors.js";
import { searchGlobalCollection } from "./global-collection.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  type FakeResponse,
  type RecordedRequest,
} from "./testing/fake-supabase.js";

const OWNED_CARD_ID = "182d9264-9cde-494b-8507-f5d3eb0ebf75";
const WISHED_CARD_ID = "b47e768e-a849-4496-a0d6-ee36d2f8105d";
const FRIEND_ID = "37fe4f31-003f-40c1-9eb6-1f39e0947037";
const OTHER_FRIEND_ID = "de78c800-d3b9-4942-a26d-e7942441aa72";

function cardRow(id: string, title: string, rarity: string) {
  return {
    id,
    wikipedia_title: title,
    rarity,
    atk: 1782,
    def: 2621,
    summary: "Résumé",
    category: null,
  };
}

function response(overrides: Record<string, unknown> = {}) {
  return {
    cards: [],
    total: null,
    searchHasMore: false,
    rarityCounts: {},
    friendOwners: {},
    ownedCardIds: [],
    wishlistCardIds: [],
    friendPendingOfferKeys: [],
    ...overrides,
  };
}

function isSearch({ method, url }: RecordedRequest): boolean {
  return method === "GET" && url.pathname === "/api/cards";
}

async function sessionAnswering(answer: FakeResponse) {
  const { fetch, requests } = fakeFetch(tokenRefresh, (request) =>
    isSearch(request) ? answer : undefined,
  );
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  const searches = () => requests.filter(isSearch);
  return { session, searches };
}

describe("searchGlobalCollection", () => {
  it("returns the cards the game finds, in its order, with what it says of each", async () => {
    const { session } = await sessionAnswering({
      status: 200,
      body: response({
        cards: [
          cardRow(OWNED_CARD_ID, "Benjamin Castaldi", "L"),
          cardRow(WISHED_CARD_ID, "Jean-Pierre Castaldi", "L"),
        ],
        friendOwners: {
          [OWNED_CARD_ID]: [
            { id: FRIEND_ID, username: "LucasPerso", rarities: ["L"] },
            { id: OTHER_FRIEND_ID, username: "Marie", rarities: ["R", "SR"] },
          ],
        },
        ownedCardIds: [OWNED_CARD_ID],
        wishlistCardIds: [WISHED_CARD_ID],
      }),
    });

    await expect(
      searchGlobalCollection(session, { text: "Castaldi" }),
    ).resolves.toMatchObject({
      cards: [
        {
          id: OWNED_CARD_ID,
          title: "Benjamin Castaldi",
          rarity: "L",
          owned: true,
          wishlisted: false,
          friends: [
            { id: FRIEND_ID, username: "LucasPerso", rarities: ["L"] },
            { id: OTHER_FRIEND_ID, username: "Marie", rarities: ["R", "SR"] },
          ],
        },
        {
          id: WISHED_CARD_ID,
          title: "Jean-Pierre Castaldi",
          rarity: "L",
          owned: false,
          wishlisted: true,
          friends: [],
        },
      ],
    });
  });

  it("returns the total, the count by rarity, the pending offers and whether more cards match", async () => {
    const pendingOfferKey = `${FRIEND_ID}:${OWNED_CARD_ID}`;
    const { session } = await sessionAnswering({
      status: 200,
      body: response({
        cards: [cardRow(OWNED_CARD_ID, "Benjamin Castaldi", "L")],
        total: 6,
        searchHasMore: true,
        rarityCounts: { PC: 5, UR: 1 },
        friendPendingOfferKeys: [pendingOfferKey],
      }),
    });

    await expect(
      searchGlobalCollection(session, { wishlist: true }),
    ).resolves.toMatchObject({
      total: 6,
      rarityCounts: { PC: 5, UR: 1 },
      pendingOfferKeys: [pendingOfferKey],
      hasMore: true,
    });
  });

  it("reads a total the game gives as a string as a number", async () => {
    const { session } = await sessionAnswering({
      status: 200,
      body: response({ total: "2776906" }),
    });

    await expect(searchGlobalCollection(session, {})).resolves.toMatchObject({
      total: 2776906,
    });
  });

  it("keeps the total and the count by rarity absent when the game leaves them out", async () => {
    const { session } = await sessionAnswering({
      status: 200,
      body: response({ total: null, rarityCounts: null }),
    });

    await expect(searchGlobalCollection(session, {})).resolves.toMatchObject({
      total: null,
      rarityCounts: null,
    });
  });

  it("sends the text, the page, each rarity, the sort and the wishlist filter as given, in one request", async () => {
    const { session, searches } = await sessionAnswering({
      status: 200,
      body: response(),
    });

    await searchGlobalCollection(session, {
      text: " Mont Blanc ",
      page: "abc",
      sort: "name",
      rarities: ["R", "SR"],
      wishlist: true,
    });

    expect(searches()).toHaveLength(1);
    const [search] = searches();
    expect([...(search?.url.searchParams ?? [])]).toEqual([
      ["page", "abc"],
      ["q", " Mont Blanc "],
      ["rarity", "R"],
      ["rarity", "SR"],
      ["sort", "name"],
      ["wishlist", "1"],
    ]);
    expect(search?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("sends no parameter when none is given", async () => {
    const { session, searches } = await sessionAnswering({
      status: 200,
      body: response(),
    });

    await searchGlobalCollection(session, {});

    expect(searches()[0]?.url.search).toBe("");
  });

  it("returns no card when nothing matches", async () => {
    const { session } = await sessionAnswering({
      status: 200,
      body: response({ total: 0 }),
    });

    await expect(
      searchGlobalCollection(session, { text: "zzz" }),
    ).resolves.toEqual({
      cards: [],
      total: 0,
      rarityCounts: {},
      pendingOfferKeys: [],
      hasMore: false,
    });
  });

  it("fails with the game's reason", async () => {
    const { session } = await sessionAnswering({
      status: 500,
      body: { error: "canceling statement due to statement timeout" },
    });

    const failure = searchGlobalCollection(session, { text: "%" });
    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(
      /HTTP 500.*canceling statement due to statement timeout/,
    );
  });

  it("fails on an unexpected response", async () => {
    const { session } = await sessionAnswering({
      status: 200,
      body: { cards: [] },
    });

    await expect(searchGlobalCollection(session, {})).rejects.toThrow(
      /unexpected response/,
    );
  });
});
