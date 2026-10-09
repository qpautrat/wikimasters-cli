import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import {
  PROFILE_COLLECTION_PAGE_SIZE,
  readProfileCollection,
  type ProfileCollectionQuery,
} from "./profile-collection.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  type FakeResponse,
  type RecordedRequest,
} from "./testing/fake-supabase.js";

const ENTRY_ID = "3d2a29bf-b8a9-4519-924a-67f0daacc644";
const CARD_ID = "e4e2d6c2-7b51-4caf-90f7-85338bef3441";
const OTHER_ENTRY_ID = "8abb4486-e185-4927-9d83-4a893706697d";
const OTHER_CARD_ID = "a3f9e3c5-693b-4241-90fd-12788fdfcf76";
const PLAYER_ID = "37fe4f31-003f-40c1-9eb6-1f39e0947037";
const firstPage: ProfileCollectionQuery = {
  page: "0",
  rarities: [],
  wishlisted: false,
};

function entry(overrides: Record<string, unknown> = {}) {
  return {
    id: ENTRY_ID,
    card: {
      id: CARD_ID,
      atk: 5108,
      def: 4312,
      rarity: "SR",
      category: "entreprise technologique américaine",
      wikipedia_title: "Match Group",
    },
    tags: [],
    count: 1,
    card_id: CARD_ID,
    starred: false,
    user_id: PLAYER_ID,
    is_shiny: false,
    obtained_at: "2026-10-05T20:14:50.409967+00:00",
    owned_by_viewer: false,
    ...overrides,
  };
}

function page(
  collection: unknown[],
  pendingTradeCardIds: string[] = [],
): FakeResponse {
  return {
    status: 200,
    body: {
      collection,
      total: null,
      rarityCounts: {},
      tagOptions: [],
      profileId: PLAYER_ID,
      pendingTradeCardIds,
    },
  };
}

function isRead({ method, url }: RecordedRequest): boolean {
  return method === "GET" && url.pathname.startsWith("/api/profile/");
}

async function sessionAnswering(response: FakeResponse) {
  const { fetch, requests } = fakeFetch(tokenRefresh, (request) =>
    isRead(request) ? response : undefined,
  );
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  const readRequests = () => requests.filter(isRead);
  return { session, readRequests };
}

describe("readProfileCollection", () => {
  it("returns each entry with its entry id, card, owned rarity, copies, state, labels and pending trade", async () => {
    const { session } = await sessionAnswering(
      page(
        [
          entry(),
          entry({
            id: OTHER_ENTRY_ID,
            card: {
              id: OTHER_CARD_ID,
              rarity: "L",
              wikipedia_title: "John Corbett",
            },
            card_id: OTHER_CARD_ID,
            count: 3,
            starred: true,
            is_shiny: true,
            tags: [
              { id: "9cd81896", name: "Métro", color: "#5eead4" },
              { id: "1ab2c3d4", name: "Acteurs", color: "#facc15" },
            ],
          }),
        ],
        [OTHER_CARD_ID],
      ),
    );

    await expect(
      readProfileCollection(session, "LucasPerso", firstPage),
    ).resolves.toEqual({
      entries: [
        {
          entryId: ENTRY_ID,
          id: CARD_ID,
          title: "Match Group",
          rarity: "SR",
          count: 1,
          starred: false,
          shiny: false,
          labels: [],
          pendingTrade: false,
        },
        {
          entryId: OTHER_ENTRY_ID,
          id: OTHER_CARD_ID,
          title: "John Corbett",
          rarity: "L",
          count: 3,
          starred: true,
          shiny: true,
          labels: ["Métro", "Acteurs"],
          pendingTrade: true,
        },
      ],
      full: false,
    });
  });

  it("sends one request with the pseudo, the page and the sort given, without statistics", async () => {
    const { session, readRequests } = await sessionAnswering(page([]));

    await readProfileCollection(session, "Lucas Perso/2", {
      ...firstPage,
      page: "3",
      sort: "name",
    });

    const [request, ...others] = readRequests();
    expect(others).toEqual([]);
    expect(request?.url.pathname).toBe(
      "/api/profile/Lucas%20Perso%2F2/collection",
    );
    expect(Object.fromEntries(request?.url.searchParams ?? [])).toEqual({
      page: "3",
      sort: "name",
      stats: "0",
      pending: "1",
    });
    expect(request?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("sends the text, each rarity and the wishlist filter as given", async () => {
    const { session, readRequests } = await sessionAnswering(page([]));

    await readProfileCollection(session, "LucasPerso", {
      ...firstPage,
      search: " Match ",
      rarities: ["SR", "L"],
      wishlisted: true,
    });

    const params = readRequests()[0]?.url.searchParams;
    expect(params?.get("q")).toBe(" Match ");
    expect(params?.getAll("rarity")).toEqual(["SR", "L"]);
    expect(params?.get("wishlisted_by_me")).toBe("1");
  });

  it("leaves out the sort, the text, the rarities and the wishlist filter when not given", async () => {
    const { session, readRequests } = await sessionAnswering(page([]));

    await readProfileCollection(session, "LucasPerso", firstPage);

    const params = readRequests()[0]?.url.searchParams;
    expect(params?.has("sort")).toBe(false);
    expect(params?.has("q")).toBe(false);
    expect(params?.has("rarity")).toBe(false);
    expect(params?.has("wishlisted_by_me")).toBe(false);
  });

  it("reports a full page", async () => {
    const { session } = await sessionAnswering(
      page(Array.from({ length: PROFILE_COLLECTION_PAGE_SIZE }, () => entry())),
    );

    await expect(
      readProfileCollection(session, "LucasPerso", firstPage),
    ).resolves.toMatchObject({ full: true });
  });

  it("returns no entry on an empty page", async () => {
    const { session } = await sessionAnswering(page([]));

    await expect(
      readProfileCollection(session, "LucasPerso", firstPage),
    ).resolves.toEqual({ entries: [], full: false });
  });

  it("fails with the game's reason", async () => {
    const { session } = await sessionAnswering({
      status: 404,
      body: { error: "Profil introuvable" },
    });

    const failure = readProfileCollection(session, "Nobody", firstPage);
    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(
      'Reading the collection of player "Nobody" failed (HTTP 404): {"error":"Profil introuvable"}',
    );
  });

  it("asks to sign in again on HTTP 401", async () => {
    const { session } = await sessionAnswering({
      status: 401,
      body: { error: "Non authentifié" },
    });

    await expect(
      readProfileCollection(session, "LucasPerso", firstPage),
    ).rejects.toThrow(AuthRequiredError);
  });

  it("fails on an unexpected response", async () => {
    const { session } = await sessionAnswering({
      status: 200,
      body: { collection: [] },
    });

    await expect(
      readProfileCollection(session, "LucasPerso", firstPage),
    ).rejects.toThrow(/unexpected response/);
  });
});
