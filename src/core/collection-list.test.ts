import { describe, expect, it } from "vitest";
import { listCollection } from "./collection-list.js";
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

describe("listCollection", () => {
  it("reads the owned cards of the signed-in user, earliest obtained first", async () => {
    const { session, requests } = await sessionWith(
      collectionSelect([ownedCard(0)]),
    );

    await listCollection(session);

    const params = collectionReads(requests)[0]?.url.searchParams;
    expect(params?.get("user_id")).toBe(`eq.${USER_ID}`);
    expect(params?.get("count")).toBe("gt.0");
    expect(params?.get("order")).toBe("obtained_at.asc,id.asc");
    expect(params?.has("snapshot_rarity")).toBe(false);
  });

  it("gives each card its id, owned rarity, copies, favourite, shiny, labels and obtention date", async () => {
    const { session } = await sessionWith(
      collectionSelect([
        {
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

    await expect(listCollection(session)).resolves.toEqual([
      {
        id: "037975c2-7d8d-432c-9315-3b51087e6d50",
        title: "Juste Cause (film, 1995)",
        rarity: "SR",
        copies: 2,
        starred: true,
        shiny: true,
        labels: ["Films & Séries", "Lieux"],
        obtainedAt: "2026-09-18T23:42:15.692426+00:00",
      },
    ]);
  });

  it("lists every card across pages", async () => {
    const rows = Array.from({ length: 1003 }, (_, index) => ownedCard(index));
    const { session, requests } = await sessionWith(collectionSelect(rows));

    const cards = await listCollection(session);

    expect(cards.map(({ id }) => id)).toEqual(rows.map((row) => row.card_id));
    expect(collectionReads(requests)).toHaveLength(2);
  });

  it("keeps only the cards of the requested owned rarity", async () => {
    const { session, requests } = await sessionWith(collectionSelect([]));

    await listCollection(session, { rarity: "PC" });

    const params = collectionReads(requests)[0]?.url.searchParams;
    expect(params?.get("snapshot_rarity")).toBe("eq.PC");
  });

  it("returns an empty list for an empty collection", async () => {
    const { session } = await sessionWith(collectionSelect([]));

    await expect(listCollection(session)).resolves.toEqual([]);
  });

  it("fails when a label has no readable name", async () => {
    const { session } = await sessionWith(
      collectionSelect([{ ...ownedCard(0), user_card_tags: [{ tags: null }] }]),
    );

    await expect(listCollection(session)).rejects.toThrow(WikiMastersError);
  });

  it("asks for a new login when the API answers 401", async () => {
    const { session } = await sessionWith(
      restRoute("GET", "user_cards", {
        status: 401,
        body: { message: "JWT expired" },
      }),
    );

    await expect(listCollection(session)).rejects.toThrow(AuthRequiredError);
  });
});
