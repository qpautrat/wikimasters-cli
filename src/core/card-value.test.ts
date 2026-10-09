import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { parseCardId } from "./card-id.js";
import { readCardValues } from "./card-value.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  type FakeResponse,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";

const soldCardId = parseCardId("45bcaa25-dbcf-4593-9363-7ad0371ff979");
const unsoldCardId = parseCardId("fc4a75a2-280c-40d5-8bd1-26ef8f842c06");
const unknownCardId = parseCardId("00000000-0000-4000-8000-000000000000");

function salesPath(cardId: string): string {
  return `/api/marketplace/cards/${cardId}/sales`;
}

function salesRoute(cardId: string, response: FakeResponse): Route {
  return ({ method, url }) =>
    method === "GET" &&
    url.pathname === salesPath(cardId) &&
    url.searchParams.get("scope") === "summary"
      ? response
      : undefined;
}

const soldCard = salesRoute(soldCardId, {
  status: 200,
  body: {
    wikipedia_title: "Dent d'Arclusaz",
    summary: { R: { average: 19 }, PC: { average: 56 } },
    isPro: false,
  },
});

const unsoldCard = salesRoute(unsoldCardId, {
  status: 200,
  body: { wikipedia_title: "Stephansen", summary: {}, isPro: false },
});

const unknownCard = salesRoute(unknownCardId, {
  status: 404,
  body: { error: "Carte introuvable" },
});

async function sessionWith(...routes: Route[]) {
  const { fetch, requests } = fakeFetch(tokenRefresh, ...routes);
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  return { session, requests };
}

function salesRequests(requests: RecordedRequest[]) {
  return requests.filter(({ url }) => !url.pathname.startsWith("/auth/v1/"));
}

describe("readCardValues", () => {
  it("returns each card's title and average sale price per rarity", async () => {
    const { session } = await sessionWith(soldCard);

    await expect(readCardValues(session, [soldCardId])).resolves.toEqual([
      {
        id: soldCardId,
        title: "Dent d'Arclusaz",
        averages: { R: 19, PC: 56 },
      },
    ]);
  });

  it("returns no average for a card never sold", async () => {
    const { session } = await sessionWith(unsoldCard);

    await expect(readCardValues(session, [unsoldCardId])).resolves.toEqual([
      { id: unsoldCardId, title: "Stephansen", averages: {} },
    ]);
  });

  it("sends one summary request per card, in the order given, with the session cookie", async () => {
    const { session, requests } = await sessionWith(unsoldCard, soldCard);

    const values = await readCardValues(session, [unsoldCardId, soldCardId]);

    expect(values.map(({ id }) => id)).toEqual([unsoldCardId, soldCardId]);
    const sent = salesRequests(requests);
    expect(sent.map(({ url }) => url.pathname)).toEqual([
      salesPath(unsoldCardId),
      salesPath(soldCardId),
    ]);
    for (const request of sent) {
      expect(request.method).toBe("GET");
      expect(request.url.searchParams.get("scope")).toBe("summary");
      expect(request.headers.get("cookie")).toMatch(
        new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
      );
    }
  });

  it("names the refused card with the game's reason and reads no further card", async () => {
    const { session, requests } = await sessionWith(soldCard, unknownCard);

    const failure = readCardValues(session, [unknownCardId, soldCardId]);
    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(
      new RegExp(`card ${unknownCardId}.*Carte introuvable`),
    );
    expect(salesRequests(requests).map(({ url }) => url.pathname)).toEqual([
      salesPath(unknownCardId),
    ]);
  });

  it("fails on a response without a title or a summary", async () => {
    const { session } = await sessionWith(
      salesRoute(soldCardId, { status: 200, body: { summary: {} } }),
    );

    await expect(readCardValues(session, [soldCardId])).rejects.toThrow(
      /unexpected response/,
    );
  });

  it("fails on a rarity without an average", async () => {
    const { session } = await sessionWith(
      salesRoute(soldCardId, {
        status: 200,
        body: { wikipedia_title: "Dent d'Arclusaz", summary: { R: {} } },
      }),
    );

    await expect(readCardValues(session, [soldCardId])).rejects.toThrow(
      /unexpected response/,
    );
  });

  it("asks for a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      salesRoute(soldCardId, { status: 401, body: { error: "Unauthorized" } }),
    );

    await expect(readCardValues(session, [soldCardId])).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
