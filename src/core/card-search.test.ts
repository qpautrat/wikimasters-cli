import { describe, expect, it } from "vitest";
import { CARD_SEARCH_LIMIT, searchCards } from "./card-search.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  restRequest,
  tokenRefresh,
  type RecordedRequest,
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

function isExactRead(request: RecordedRequest): boolean {
  return request.url.searchParams
    .getAll("wikipedia_title")
    .some((filter) => filter.startsWith("imatch.^"));
}

function catalogue(exact: Row[], containing: Row[]): Route {
  return (request) => {
    if (!isCardRead(request)) return undefined;
    return { status: 200, body: isExactRead(request) ? exact : containing };
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

describe("searchCards", () => {
  it("lists the catalogue cards whose title contains the text, case-insensitively", async () => {
    const dome = row(1, "Half Dome");
    const trail = row(2, "Half Dome Trail");
    const { session, requests } = await sessionWith(
      catalogue([], [dome, trail]),
    );

    await expect(searchCards(session, "half dom")).resolves.toEqual({
      cards: [
        { id: dome.id, title: "Half Dome", rarity: "C" },
        { id: trail.id, title: "Half Dome Trail", rarity: "C" },
      ],
      truncated: false,
    });
    const containing = requests.find(
      (request) => isCardRead(request) && !isExactRead(request),
    );
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

  it("puts the cards titled exactly as the text first, from a single read when it holds every match", async () => {
    const dome = row(1, "Dome");
    const halfDome = row(2, "Half Dome");
    const { session, requests } = await sessionWith(
      catalogue([], [halfDome, dome]),
    );

    const { cards } = await searchCards(session, "DOME");

    expect(cards.map(({ title }) => title)).toEqual(["Dome", "Half Dome"]);
    expect(requests.filter(isCardRead)).toHaveLength(1);
  });

  it("reads the exact titles apart when more cards match, and puts them first", async () => {
    const others = Array.from({ length: CARD_SEARCH_LIMIT + 1 }, (_, index) =>
      row(index, `A dome ${index}`),
    );
    const dome = row(99, "Dome");
    const { session, requests } = await sessionWith(catalogue([dome], others));

    const { cards, truncated } = await searchCards(session, "dome");

    expect(cards).toHaveLength(CARD_SEARCH_LIMIT);
    expect(cards[0]?.title).toBe("Dome");
    expect(cards[1]?.title).toBe("A dome 0");
    expect(truncated).toBe(true);
    const exact = requests.find(isExactRead);
    expect(exact?.url.searchParams.getAll("wikipedia_title")).toEqual([
      "ilike.dome",
      "imatch.^dome$",
    ]);
    expect(exact?.url.searchParams.get("limit")).toBe(
      String(CARD_SEARCH_LIMIT),
    );
  });

  it("matches the text literally, wildcards and regex characters included", async () => {
    const { session, requests } = await sessionWith(catalogue([], []));

    await searchCards(session, "100% EL*KE_(a.b)\\");

    const containing = requests.find(
      (request) => isCardRead(request) && !isExactRead(request),
    );
    expect(containing?.url.searchParams.getAll("wikipedia_title")).toEqual([
      "ilike.%100\\% EL_KE\\_(a.b)\\\\%",
      "imatch.100% EL\\*KE_\\(a\\.b\\)\\\\",
    ]);
  });

  it("returns at most 50 cards and says when more match", async () => {
    const rows = Array.from({ length: CARD_SEARCH_LIMIT + 1 }, (_, index) =>
      row(index, `Card ${index}`),
    );
    const { session } = await sessionWith(catalogue([], rows));

    const { cards, truncated } = await searchCards(session, "card");

    expect(cards).toHaveLength(CARD_SEARCH_LIMIT);
    expect(truncated).toBe(true);
  });

  it("keeps exactly 50 matches untruncated", async () => {
    const rows = Array.from({ length: CARD_SEARCH_LIMIT }, (_, index) =>
      row(index, `Card ${index}`),
    );
    const { session } = await sessionWith(catalogue([], rows));

    await expect(searchCards(session, "card")).resolves.toMatchObject({
      truncated: false,
    });
  });

  it("succeeds with no card when nothing matches", async () => {
    const { session } = await sessionWith(catalogue([], []));

    await expect(searchCards(session, "zqxjw")).resolves.toEqual({
      cards: [],
      truncated: false,
    });
  });

  it("reports an API failure", async () => {
    const { session } = await sessionWith((request) =>
      isCardRead(request)
        ? { status: 500, body: { message: "statement timeout" } }
        : undefined,
    );

    const failure = searchCards(session, "dome");
    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(/statement timeout/);
  });

  it("asks to log in again on HTTP 401", async () => {
    const { session } = await sessionWith((request) =>
      isCardRead(request)
        ? { status: 401, body: { message: "JWT expired" } }
        : undefined,
    );

    await expect(searchCards(session, "dome")).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
