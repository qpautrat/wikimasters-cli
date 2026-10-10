import { describe, expect, it } from "vitest";
import {
  listCollection,
  parseCollectionPageLimit,
  parseCollectionPageNumber,
} from "./collection-list.js";
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

function ownedCard(index: number) {
  const suffix = String(index).padStart(12, "0");
  return {
    id: `22222222-2222-4222-8222-${suffix}`,
    card_id: `11111111-1111-4111-8111-${suffix}`,
    snapshot_title: `Card ${index}`,
    snapshot_rarity: "C",
    count: 1,
    starred: false,
    is_shiny: false,
    obtained_at: `2026-09-18T23:42:15.${suffix.slice(-6)}+00:00`,
    user_card_tags: [],
  };
}

function collectionSelect(rows: unknown[]): Route {
  const isCollectionRead = restRequest("GET", "user_cards");
  return (request) => {
    if (!isCollectionRead(request)) return undefined;
    const { url } = request;
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? rows.length);
    return { status: 200, body: rows.slice(offset, offset + limit) };
  };
}

const firstPage = {
  page: parseCollectionPageNumber("1"),
  limit: parseCollectionPageLimit("1000"),
};

async function sessionWith(...routes: Route[]) {
  const { fetch, requests } = fakeFetch(tokenRefresh, ...routes);
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  return { session, requests };
}

function collectionReads(requests: RecordedRequest[]) {
  return requests.filter(restRequest("GET", "user_cards"));
}

describe("parseCollectionPageNumber and parseCollectionPageLimit", () => {
  it("refuse a page or a limit that is not a strictly positive integer", () => {
    expect(() => parseCollectionPageNumber("0")).toThrow(WikiMastersError);
    expect(() => parseCollectionPageLimit("-5")).toThrow(WikiMastersError);
    expect(() => parseCollectionPageLimit("ten")).toThrow(WikiMastersError);
  });
});

describe("listCollection", () => {
  it("reads the owned cards of the signed-in user, earliest obtained first", async () => {
    const { session, requests } = await sessionWith(
      collectionSelect([ownedCard(0)]),
    );

    await listCollection(session, firstPage);

    const params = collectionReads(requests)[0]?.url.searchParams;
    expect(params?.get("user_id")).toBe(`eq.${USER_ID}`);
    expect(params?.get("count")).toBe("gt.0");
    expect(params?.get("order")).toBe("obtained_at.asc,id.asc");
    expect(params?.has("snapshot_rarity")).toBe(false);
  });

  it("gives each card its entry id, card id, owned rarity, copies, favourite, shiny, labels and obtention date", async () => {
    const { session } = await sessionWith(
      collectionSelect([
        {
          id: "3d2a29bf-b8a9-4519-924a-67f0daacc644",
          card_id: "037975c2-7d8d-432c-9315-3b51087e6d50",
          snapshot_title: "Juste Cause (film, 1995)",
          snapshot_rarity: "SR",
          count: 2,
          starred: true,
          is_shiny: true,
          obtained_at: "2026-09-18T23:42:15.692426+00:00",
          user_card_tags: [
            { tags: { name: "Lieux" } },
            { tags: { name: "Films & Séries" } },
          ],
        },
      ]),
    );

    await expect(listCollection(session, firstPage)).resolves.toEqual({
      cards: [
        {
          entryId: "3d2a29bf-b8a9-4519-924a-67f0daacc644",
          id: "037975c2-7d8d-432c-9315-3b51087e6d50",
          title: "Juste Cause (film, 1995)",
          rarity: "SR",
          copies: 2,
          starred: true,
          shiny: true,
          labels: ["Films & Séries", "Lieux"],
          obtainedAt: "2026-09-18T23:42:15.692426+00:00",
        },
      ],
      full: false,
    });
  });

  it("reads the requested page in a single request", async () => {
    const rows = Array.from({ length: 7 }, (_, index) => ownedCard(index));
    const { session, requests } = await sessionWith(collectionSelect(rows));

    const { cards } = await listCollection(session, {
      page: parseCollectionPageNumber("2"),
      limit: parseCollectionPageLimit("3"),
    });

    expect(cards.map(({ id }) => id)).toEqual(
      rows.slice(3, 6).map((row) => row.card_id),
    );
    const reads = collectionReads(requests);
    expect(reads).toHaveLength(1);
    expect(reads[0]?.url.searchParams.get("offset")).toBe("3");
    expect(reads[0]?.url.searchParams.get("limit")).toBe("3");
  });

  it("says the page is full when it holds as many cards as requested", async () => {
    const rows = Array.from({ length: 3 }, (_, index) => ownedCard(index));
    const { session } = await sessionWith(collectionSelect(rows));

    const page = await listCollection(session, {
      page: parseCollectionPageNumber("1"),
      limit: parseCollectionPageLimit("3"),
    });

    expect(page.full).toBe(true);
  });

  it("says the page is not full when it holds fewer cards than requested", async () => {
    const rows = Array.from({ length: 2 }, (_, index) => ownedCard(index));
    const { session } = await sessionWith(collectionSelect(rows));

    const page = await listCollection(session, {
      page: parseCollectionPageNumber("1"),
      limit: parseCollectionPageLimit("3"),
    });

    expect(page.full).toBe(false);
  });

  it("keeps only the cards of the requested owned rarity", async () => {
    const { session, requests } = await sessionWith(collectionSelect([]));

    await listCollection(session, firstPage, { rarity: "PC" });

    const params = collectionReads(requests)[0]?.url.searchParams;
    expect(params?.get("snapshot_rarity")).toBe("eq.PC");
  });

  it("returns an empty list for an empty collection", async () => {
    const { session } = await sessionWith(collectionSelect([]));

    await expect(listCollection(session, firstPage)).resolves.toEqual({
      cards: [],
      full: false,
    });
  });

  it("fails when a label has no readable name", async () => {
    const { session } = await sessionWith(
      collectionSelect([{ ...ownedCard(0), user_card_tags: [{ tags: null }] }]),
    );

    await expect(listCollection(session, firstPage)).rejects.toThrow(
      WikiMastersError,
    );
  });

  it("asks for a new login when the API answers 401", async () => {
    const { session } = await sessionWith(
      restRoute("GET", "user_cards", {
        status: 401,
        body: { message: "JWT expired" },
      }),
    );

    await expect(listCollection(session, firstPage)).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
