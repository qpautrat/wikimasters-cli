import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  type RecordedRequest,
  type Route,
} from "./testing/fake-supabase.js";
import { asPlayerId } from "./player-id.js";
import { asTradeId } from "./trade-id.js";
import {
  parseTradeCard,
  parseTradeWikibidous,
  proposeTrade,
  type TradeProposal,
} from "./trade-propose.js";

const recipientId = asPlayerId("37fe4f31-003f-40c1-9eb6-1f39e0947037");
const proposedTradeId = "c2ab7935-4b63-41f3-b23c-d00c11d2f1f9";
const myEntry = "9a93083a-e54c-48c2-a068-b406e54f3887";
const myCard = "4e3ad087-d927-4ea0-a3d3-65cb528cb3e6";
const theirEntry = "50649e88-9161-4477-870a-1f9349236fe8";
const theirCard = "c0ef431c-0850-4ec2-ba83-a95dc55524b1";

const proposal: TradeProposal = {
  recipientId,
  give: [parseTradeCard(`${myEntry}:${myCard}`)],
  take: [parseTradeCard(`${theirEntry}:${theirCard}`)],
  giveWikibidous: parseTradeWikibidous("0"),
  takeWikibidous: parseTradeWikibidous("15"),
};

function tradesRoute(response: { status: number; body: unknown }): Route {
  return ({ method, url }) =>
    method === "POST" && url.pathname === "/api/trades" ? response : undefined;
}

const acceptProposal = tradesRoute({
  status: 201,
  body: {
    trade: {
      id: proposedTradeId,
      recipient_id: recipientId,
      status: "pending",
      parent_trade_id: null,
    },
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

function proposalRequests(requests: RecordedRequest[]) {
  return requests.filter(({ url }) => url.pathname === "/api/trades");
}

describe("parseTradeCard", () => {
  it("splits the entry id and the card id", () => {
    expect(parseTradeCard(`${myEntry}:${myCard}`)).toEqual({
      entryId: myEntry,
      cardId: myCard,
    });
  });

  it.each(["", myEntry, `${myEntry}:`, `:${myCard}`])("refuses %j", (raw) => {
    expect(() => parseTradeCard(raw)).toThrow(
      /expected <entry-id>:<card-id>; no trade was proposed/,
    );
  });

  it("takes both ids as given", () => {
    expect(parseTradeCard(" Entry:ABC")).toEqual({
      entryId: " Entry",
      cardId: "ABC",
    });
  });
});

describe("parseTradeWikibidous", () => {
  it.each([
    { raw: "0", expected: 0 },
    { raw: "250", expected: 250 },
    { raw: "-5", expected: -5 },
  ])("accepts the integer $raw as given", ({ raw, expected }) => {
    expect(parseTradeWikibidous(raw)).toBe(expected);
  });

  it.each(["2.5", "1e3", "abc", ""])("refuses %j", (raw) => {
    expect(() => parseTradeWikibidous(raw)).toThrow(
      `${JSON.stringify(raw)} is not an integer of wikibidous; no trade was proposed`,
    );
  });
});

describe("proposeTrade", () => {
  it("proposes the exact cards and amounts in a single request", async () => {
    const { session, requests } = await sessionWith(acceptProposal);

    await expect(proposeTrade(session, proposal)).resolves.toEqual({
      tradeId: proposedTradeId,
    });

    expect(
      requests.filter(({ url }) => url.pathname !== "/auth/v1/token"),
    ).toHaveLength(1);
    const [sent] = proposalRequests(requests);
    expect(JSON.parse(sent?.body ?? "{}")).toEqual({
      recipient_id: recipientId,
      items: [
        {
          user_card_id: myEntry,
          card_id: myCard,
          offered_by: session.userId,
        },
        {
          user_card_id: theirEntry,
          card_id: theirCard,
          offered_by: recipientId,
        },
      ],
      initiator_wikibidous: 0,
      recipient_wikibidous: 15,
    });
    expect(sent?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("sends the trade it counters as parent_trade_id", async () => {
    const counterTo = asTradeId("3694d10c-0f1b-414f-81fc-2e61be9c288d");
    const { session, requests } = await sessionWith(acceptProposal);

    await proposeTrade(session, { ...proposal, counterTo });

    const [sent] = proposalRequests(requests);
    expect(JSON.parse(sent?.body ?? "{}")).toMatchObject({
      parent_trade_id: counterTo,
    });
  });

  it("sends a proposal without cards as given", async () => {
    const { session, requests } = await sessionWith(acceptProposal);

    await proposeTrade(session, { ...proposal, give: [], take: [] });

    const [sent] = proposalRequests(requests);
    expect(JSON.parse(sent?.body ?? "{}")).toMatchObject({ items: [] });
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
      reason: "an empty proposal",
      status: 400,
      body: {
        error: "Sélectionnez au moins une carte ou des wikibidous à échanger",
      },
      expected: /Sélectionnez au moins une carte ou des wikibidous à échanger/,
    },
    {
      reason: "an insufficient balance",
      status: 400,
      body: { error: "Solde de wikibidous insuffisant" },
      expected: /Solde de wikibidous insuffisant/,
    },
  ])(
    "reports the game's refusal for $reason with its reason",
    async ({ status, body, expected }) => {
      const { session } = await sessionWith(tradesRoute({ status, body }));

      const failure = proposeTrade(session, proposal);

      await expect(failure).rejects.toThrow(WikiMastersError);
      await expect(failure).rejects.toThrow(expected);
    },
  );

  it("fails on a response without the proposed trade", async () => {
    const { session } = await sessionWith(
      tradesRoute({ status: 201, body: {} }),
    );

    await expect(proposeTrade(session, proposal)).rejects.toThrow(
      /unexpected response, which may have proposed it/,
    );
  });

  it("asks for a new login when the site rejects the session", async () => {
    const { session } = await sessionWith(
      tradesRoute({ status: 401, body: { error: "Unauthorized" } }),
    );

    await expect(proposeTrade(session, proposal)).rejects.toThrow(
      AuthRequiredError,
    );
  });
});
