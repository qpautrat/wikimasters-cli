import { describe, expect, it } from "vitest";
import {
  createAuction,
  parseAuctionDuration,
  parseStartingPrice,
} from "./auction-create.js";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";

const entryId = "944d72cb-9118-41ff-ba3b-026c47ec27fc";
const createdAuctionId = "d6669009-683d-44b6-b6e7-2c0960c37f2f";
const startingPrice = parseStartingPrice("250");
const duration = parseAuctionDuration("45");

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
  it.each([
    { raw: "30", expected: 30 },
    { raw: "0", expected: 0 },
    { raw: "-5", expected: -5 },
  ])("accepts the integer $raw as given", ({ raw, expected }) => {
    expect(parse(raw)).toBe(expected);
  });

  it.each([
    "2.5",
    "1e3",
    "030",
    "-030",
    "-",
    " 30",
    "abc",
    "",
    "9007199254740993",
  ])("refuses %j", (raw) => {
    expect(() => parse(raw)).toThrow(
      `${JSON.stringify(raw)} is not an integer`,
    );
  });

  it("says nothing was put up for auction", () => {
    expect(() => parse("2.5")).toThrow("nothing was put up for auction");
  });
});

describe("createAuction", () => {
  it("puts the entry up for auction at the exact price and duration in a single request", async () => {
    const { session, requests } = await sessionWith(acceptListing);

    await expect(
      createAuction(session, entryId, startingPrice, duration),
    ).resolves.toEqual({ auctionId: createdAuctionId });

    expect(
      requests.filter(({ url }) => url.pathname !== "/auth/v1/token"),
    ).toHaveLength(1);
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

  it.each([
    {
      reason: "an entry that is not yours",
      status: 409,
      body: { error: "Vous ne possédez pas cette carte" },
      expected: /Vous ne possédez pas cette carte/,
    },
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
      reason: "a refused starting price",
      status: 400,
      body: { error: "Mise de départ invalide (min 1)" },
      expected: /Mise de départ invalide \(min 1\)/,
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
      const { session } = await sessionWith(marketplaceRoute({ status, body }));

      const failure = createAuction(session, entryId, startingPrice, duration);

      await expect(failure).rejects.toThrow(WikiMastersError);
      await expect(failure).rejects.toThrow(expected);
    },
  );

  it("fails on a response without the created auction", async () => {
    const { session } = await sessionWith(
      marketplaceRoute({ status: 200, body: {} }),
    );

    await expect(
      createAuction(session, entryId, startingPrice, duration),
    ).rejects.toThrow(/unexpected response, which may have put it up/);
  });

  it("asks for a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      marketplaceRoute({ status: 401, body: { error: "Unauthorized" } }),
    );

    await expect(
      createAuction(session, entryId, startingPrice, duration),
    ).rejects.toThrow(AuthRequiredError);
  });
});
