import { describe, expect, it } from "vitest";
import {
  createAuction,
  parseAuctionDuration,
  parseStartingPrice,
} from "./auction-create.js";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { parseCardId } from "./card-id.js";
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

const cardId = parseCardId("3fc9a132-31db-4b14-832c-04823e02113d");
const entryId = "944d72cb-9118-41ff-ba3b-026c47ec27fc";
const createdAuctionId = "d6669009-683d-44b6-b6e7-2c0960c37f2f";
const startingPrice = parseStartingPrice("250");
const duration = parseAuctionDuration("45");

function collectionEntry(owned: boolean): Route {
  return restRoute("GET", "user_cards", {
    status: 200,
    body: owned ? [{ id: entryId }] : [],
  });
}

function marketplaceRoute(response: { status: number; body: unknown }): Route {
  return ({ method, url }) =>
    method === "POST" && url.pathname === "/api/marketplace"
      ? response
      : undefined;
}

const acceptListing = marketplaceRoute({
  status: 200,
  body: { auction_id: createdAuctionId },
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

function listingRequests(requests: RecordedRequest[]) {
  return requests.filter(({ url }) => url.pathname === "/api/marketplace");
}

describe.each([
  { name: "parseStartingPrice", parse: parseStartingPrice },
  { name: "parseAuctionDuration", parse: parseAuctionDuration },
])("$name", ({ parse }) => {
  it("accepts a strictly positive integer", () => {
    expect(parse("30")).toBe(30);
  });

  it.each([
    "0",
    "-5",
    "2.5",
    "1e3",
    "030",
    " 30",
    "abc",
    "",
    "9007199254740993",
  ])("refuses %j", (raw) => {
    expect(() => parse(raw)).toThrow(
      `${JSON.stringify(raw)} is not a strictly positive integer`,
    );
  });

  it("says nothing was put up for auction", () => {
    expect(() => parse("0")).toThrow("nothing was put up for auction");
  });
});

describe("createAuction", () => {
  it("puts the collection entry of the card up for auction at the exact price and duration", async () => {
    const { session, requests } = await sessionWith(
      collectionEntry(true),
      acceptListing,
    );

    await expect(
      createAuction(session, cardId, startingPrice, duration),
    ).resolves.toEqual({ auctionId: createdAuctionId });

    const read = requests.find(restRequest("GET", "user_cards"));
    expect(read?.url.searchParams.get("user_id")).toBe(`eq.${USER_ID}`);
    expect(read?.url.searchParams.get("card_id")).toBe(`eq.${cardId}`);
    expect(read?.url.searchParams.get("count")).toBe("gt.0");
    const [listing] = listingRequests(requests);
    expect(JSON.parse(listing?.body ?? "{}")).toEqual({
      card_id: entryId,
      base_amount: 250,
      duration_minutes: 45,
    });
    expect(listing?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("refuses a card absent from the collection without sending anything", async () => {
    const { session, requests } = await sessionWith(
      collectionEntry(false),
      acceptListing,
    );

    const failure = createAuction(session, cardId, startingPrice, duration);

    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(
      `Card ${cardId} is not in your collection`,
    );
    expect(listingRequests(requests)).toHaveLength(0);
  });

  it.each([
    {
      reason: "human verification",
      status: 403,
      body: {
        error: "Vérification humaine requise",
        code: "human_verification_required",
      },
      expected: /human_verification_required/,
    },
    {
      reason: "a refused duration",
      status: 400,
      body: { error: "Durée invalide (entre 10 minutes et 12 heures)" },
      expected: /Durée invalide \(entre 10 minutes et 12 heures\)/,
    },
    {
      reason: "too many auctions",
      status: 409,
      body: { error: "Vous avez déjà 5 enchères actives" },
      expected: /Vous avez déjà 5 enchères actives/,
    },
  ])(
    "reports the game's refusal for $reason with its reason",
    async ({ status, body, expected }) => {
      const { session } = await sessionWith(
        collectionEntry(true),
        marketplaceRoute({ status, body }),
      );

      const failure = createAuction(session, cardId, startingPrice, duration);

      await expect(failure).rejects.toThrow(WikiMastersError);
      await expect(failure).rejects.toThrow(expected);
    },
  );

  it("fails on a response without the created auction", async () => {
    const { session } = await sessionWith(
      collectionEntry(true),
      marketplaceRoute({ status: 200, body: {} }),
    );

    await expect(
      createAuction(session, cardId, startingPrice, duration),
    ).rejects.toThrow(/unexpected response, which may have put it up/);
  });

  it("asks for a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      collectionEntry(true),
      marketplaceRoute({ status: 401, body: { error: "Unauthorized" } }),
    );

    await expect(
      createAuction(session, cardId, startingPrice, duration),
    ).rejects.toThrow(AuthRequiredError);
  });
});
