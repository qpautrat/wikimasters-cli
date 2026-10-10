import { describe, expect, it } from "vitest";
import {
  CARD_SEARCH_LIMIT,
  parseCardSearchField,
  searchCards,
} from "./card-search.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  restRequest,
  tokenRefresh,
  type Route,
} from "./testing/fake-supabase.js";

interface Row {
  id: string;
  wikipedia_title: string;
  rarity: string;
}

function row(index: number, title: string): Row {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    wikipedia_title: title,
    rarity: "C",
  };
}

const isCardRead = restRequest("GET", "cards");

function catalogue(rows: Row[]): Route {
  return (request) =>
    isCardRead(request) ? { status: 200, body: rows } : undefined;
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

describe("searchCards", () => {
  it("lists the catalogue cards whose title contains the text, case-insensitively", async () => {
    const dome = row(1, "Half Dome");
    const trail = row(2, "Half Dome Trail");
    const { session, requests } = await sessionWith(catalogue([dome, trail]));

    await expect(searchCards(session, "half dom", "title")).resolves.toEqual({
      cards: [
        { id: dome.id, title: "Half Dome", rarity: "C" },
        { id: trail.id, title: "Half Dome Trail", rarity: "C" },
      ],
      truncated: false,
    });
    const containing = requests.find(isCardRead);
    expect(containing?.url.searchParams.getAll("wikipedia_title")).toEqual([
      "ilike.%half dom%",
      "imatch.half dom",
    ]);
    expect(containing?.url.searchParams.get("select")).toBe(
      "id,wikipedia_title,rarity",
    );
    expect(containing?.url.searchParams.get("order")).toBe(
      "wikipedia_title.asc,id.asc",
    );
    expect(containing?.url.searchParams.get("limit")).toBe(
      String(CARD_SEARCH_LIMIT + 1),
    );
  });

  it("sends a single read and keeps the title order, an exact title included", async () => {
    const aDome = row(1, "A dome");
    const dome = row(2, "Dome");
    const { session, requests } = await sessionWith(catalogue([aDome, dome]));

    const { cards } = await searchCards(session, "dome", "title");

    expect(cards.map(({ title }) => title)).toEqual(["A dome", "Dome"]);
    expect(requests.filter(isCardRead)).toHaveLength(1);
  });

  it("matches the text literally, wildcards and regex characters included", async () => {
    const { session, requests } = await sessionWith(catalogue([]));

    await searchCards(session, "100% EL*KE_(a.b)\\", "title");

    const containing = requests.find(isCardRead);
    expect(containing?.url.searchParams.getAll("wikipedia_title")).toEqual([
      "ilike.%100\\% EL_KE\\_(a.b)\\\\%",
      "imatch.100% EL\\*KE_\\(a\\.b\\)\\\\",
    ]);
  });

  it("returns at most 50 cards and says when more match", async () => {
    const rows = Array.from({ length: CARD_SEARCH_LIMIT + 1 }, (_, index) =>
      row(index, `Card ${index}`),
    );
    const { session } = await sessionWith(catalogue(rows));

    const { cards, truncated } = await searchCards(session, "card", "title");

    expect(cards).toHaveLength(CARD_SEARCH_LIMIT);
    expect(truncated).toBe(true);
  });

  it("keeps exactly 50 matches untruncated", async () => {
    const rows = Array.from({ length: CARD_SEARCH_LIMIT }, (_, index) =>
      row(index, `Card ${index}`),
    );
    const { session } = await sessionWith(catalogue(rows));

    await expect(searchCards(session, "card", "title")).resolves.toMatchObject({
      truncated: false,
    });
  });

  it("succeeds with no card when nothing matches", async () => {
    const { session } = await sessionWith(catalogue([]));

    await expect(searchCards(session, "zqxjw", "title")).resolves.toEqual({
      cards: [],
      truncated: false,
    });
  });

  it.each([
    ["category", "category"],
    ["summary", "summary"],
  ] as const)(
    "searches the %s instead of the title, ordered by title",
    async (field, column) => {
      const caliste = row(1, "Caliste (esport)");
      const { session, requests } = await sessionWith(catalogue([caliste]));

      await expect(searchCards(session, "Esport", field)).resolves.toEqual({
        cards: [{ id: caliste.id, title: "Caliste (esport)", rarity: "C" }],
        truncated: false,
      });
      const [read] = requests.filter(isCardRead);
      expect(read?.url.searchParams.getAll(column)).toEqual([
        "ilike.%Esport%",
        "imatch.Esport",
      ]);
      expect(read?.url.searchParams.has("wikipedia_title")).toBe(false);
      expect(read?.url.searchParams.get("order")).toBe(
        "wikipedia_title.asc,id.asc",
      );
    },
  );

  it("reports an API failure", async () => {
    const { session } = await sessionWith((request) =>
      isCardRead(request)
        ? { status: 500, body: { message: "statement timeout" } }
        : undefined,
    );

    const failure = searchCards(session, "dome", "title");
    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(/statement timeout/);
  });

  it("asks to log in again on HTTP 401", async () => {
    const { session } = await sessionWith((request) =>
      isCardRead(request)
        ? { status: 401, body: { message: "JWT expired" } }
        : undefined,
    );

    await expect(searchCards(session, "dome", "title")).rejects.toThrow(
      AuthRequiredError,
    );
  });
});

describe("parseCardSearchField", () => {
  it.each(["title", "category", "summary"])("accepts %s", (field) => {
    expect(parseCardSearchField(field)).toBe(field);
  });

  it("refuses any other field, naming the accepted ones", () => {
    expect(() => parseCardSearchField("rarity")).toThrow(
      'Invalid field: "rarity" is not one of title, category, summary; nothing was read',
    );
  });
});
