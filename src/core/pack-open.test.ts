import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { asCardId } from "./card-id.js";
import { asEntryId } from "./entry-id.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { openPack } from "./pack-open.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";

function packRoute(response: { status: number; body: unknown }): Route {
  return ({ method, url }) =>
    method === "POST" && url.pathname === "/api/packs/open"
      ? response
      : undefined;
}

const gameOpens = packRoute({
  status: 200,
  body: {
    cards: [
      {
        id: "03602a12-c0cd-4ecb-95fc-18a106234118",
        wikipedia_title: "Les Avellanes i Santa Linya",
        rarity: "C",
        user_card_id: "d05b9918-cda4-499d-988f-68b7f666e34c",
      },
      {
        id: "442b882c-902b-482b-9cd0-12960e2ce93d",
        wikipedia_title: "1934",
        rarity: "R",
        user_card_id: "b83a9b2c-9bcd-4ee4-a8ba-59b078e83078",
      },
    ],
    owned_copies: [],
    packs_remaining: 9,
    packs_last_regen_at: "2026-11-20T11:35:21.237Z",
  },
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

function packRequests(requests: RecordedRequest[]) {
  return requests.filter(({ url }) => url.pathname === "/api/packs/open");
}

describe("openPack", () => {
  it("returns each card obtained with its ids, title and rarity", async () => {
    const { session, requests } = await sessionWith(gameOpens);

    await expect(openPack(session)).resolves.toEqual([
      {
        cardId: asCardId("03602a12-c0cd-4ecb-95fc-18a106234118"),
        entryId: asEntryId("d05b9918-cda4-499d-988f-68b7f666e34c"),
        title: "Les Avellanes i Santa Linya",
        rarity: "C",
      },
      {
        cardId: asCardId("442b882c-902b-482b-9cd0-12960e2ce93d"),
        entryId: asEntryId("b83a9b2c-9bcd-4ee4-a8ba-59b078e83078"),
        title: "1934",
        rarity: "R",
      },
    ]);

    const [open] = packRequests(requests);
    expect(open?.body).toBeFalsy();
    expect(open?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("sends exactly one request, leaving judging the remaining packs to the game", async () => {
    const { session, requests } = await sessionWith(gameOpens);

    await openPack(session);

    expect(
      requests.filter(({ url }) => !url.pathname.startsWith("/auth/v1/")),
    ).toEqual(packRequests(requests));
    expect(packRequests(requests)).toHaveLength(1);
  });

  it("reports the game's refusal with its reason", async () => {
    const { session } = await sessionWith(
      packRoute({
        status: 403,
        body: { error: "Aucun paquet disponible", packs_remaining: 0 },
      }),
    );

    const failure = openPack(session);

    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(/Aucun paquet disponible/);
  });

  it("fails on a response without cards", async () => {
    const { session } = await sessionWith(
      packRoute({ status: 200, body: { packs_remaining: 3 } }),
    );

    await expect(openPack(session)).rejects.toThrow(
      /unexpected response, which may have opened it/,
    );
  });

  it("fails on a card without its entry id", async () => {
    const { session } = await sessionWith(
      packRoute({
        status: 200,
        body: { cards: [{ id: "a", wikipedia_title: "A", rarity: "C" }] },
      }),
    );

    await expect(openPack(session)).rejects.toThrow(/unexpected response/);
  });

  it("asks for a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      packRoute({ status: 401, body: { error: "Unauthorized" } }),
    );

    await expect(openPack(session)).rejects.toThrow(AuthRequiredError);
  });
});
