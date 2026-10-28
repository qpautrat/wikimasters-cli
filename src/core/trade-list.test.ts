import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "./auth-cookie.js";
import { asCardId } from "./card-id.js";
import { asEntryId } from "./entry-id.js";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import { asPlayerId } from "./player-id.js";
import { resumeSession } from "./session.js";
import {
  fakeFetch,
  tokenRefresh,
  USER_ID,
  type FakeResponse,
  type RecordedRequest,
} from "./testing/fake-supabase.js";
import { asTradeId } from "./trade-id.js";
import { listTrades } from "./trade-list.js";

const OTHER_ID = "37fe4f31-003f-40c1-9eb6-1f39e0947037";

function player(id: string, username: string) {
  return {
    id,
    username,
    avatar_url: null,
    avatar_pos_x: 50,
    avatar_pos_y: 50,
  };
}

function item(
  tradeId: string,
  offeredBy: string,
  userCardId: string,
  cardId: string,
  title: string,
) {
  return {
    id: "a0c1c4c3-0000-4000-8000-000000000000",
    card: {
      id: cardId,
      rarity: "R",
      wikipedia_title: title,
      is_shiny: false,
    },
    card_id: cardId,
    is_shiny: false,
    trade_id: tradeId,
    offered_by: offeredBy,
    snapshot_atk: 4970,
    snapshot_def: 4794,
    user_card_id: userCardId,
    snapshot_rarity: "R",
  };
}

const RECEIVED_ID = "422842f0-1111-4111-8111-111111111111";
const SENT_ID = "57202da8-3e09-40d6-9c0b-b42a4e149133";

const received = {
  id: RECEIVED_ID,
  status: "pending",
  initiator: player(OTHER_ID, "LucasPerso"),
  recipient: player(USER_ID, "Moi"),
  created_at: "2026-10-27T10:00:00+00:00",
  updated_at: "2026-10-27T10:00:00+00:00",
  initiator_id: OTHER_ID,
  recipient_id: USER_ID,
  parent_trade_id: null,
  initiator_wikibidous: 0,
  recipient_wikibidous: 20,
  items: [
    item(
      RECEIVED_ID,
      OTHER_ID,
      "3c359a70-0000-4000-8000-000000000001",
      "d9fdb14c-0000-4000-8000-000000000001",
      "Escalade",
    ),
    item(
      RECEIVED_ID,
      USER_ID,
      "3c359a70-0000-4000-8000-000000000002",
      "d9fdb14c-0000-4000-8000-000000000002",
      "Alpinisme",
    ),
  ],
};

const sent = {
  id: SENT_ID,
  status: "cancelled",
  initiator: player(USER_ID, "Moi"),
  recipient: player(OTHER_ID, "LucasPerso"),
  created_at: "2026-10-20T10:00:00+00:00",
  updated_at: "2026-10-21T10:00:00+00:00",
  initiator_id: USER_ID,
  recipient_id: OTHER_ID,
  parent_trade_id: RECEIVED_ID,
  initiator_wikibidous: 50,
  recipient_wikibidous: 0,
  items: [] as unknown[],
};

function listed(trades: unknown[]): FakeResponse {
  return { status: 200, body: { trades } };
}

function isTradeList({ method, url }: RecordedRequest): boolean {
  return method === "GET" && url.pathname === "/api/trades";
}

async function sessionAnswering(response: FakeResponse) {
  const { fetch, requests } = fakeFetch(tokenRefresh, (request) =>
    isTradeList(request) ? response : undefined,
  );
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  return { session, listRequests: () => requests.filter(isTradeList) };
}

describe("listTrades", () => {
  it("returns each trade in the game's order, with the cards and wikibidous each player gives", async () => {
    const { session } = await sessionAnswering(listed([received, sent]));

    await expect(listTrades(session)).resolves.toEqual([
      {
        tradeId: asTradeId(RECEIVED_ID),
        status: "pending",
        createdAt: "2026-10-27T10:00:00+00:00",
        initiator: {
          playerId: asPlayerId(OTHER_ID),
          username: "LucasPerso",
          cards: [
            {
              entryId: asEntryId("3c359a70-0000-4000-8000-000000000001"),
              cardId: asCardId("d9fdb14c-0000-4000-8000-000000000001"),
              title: "Escalade",
            },
          ],
          wikibidous: 0,
        },
        recipient: {
          playerId: asPlayerId(USER_ID),
          username: "Moi",
          cards: [
            {
              entryId: asEntryId("3c359a70-0000-4000-8000-000000000002"),
              cardId: asCardId("d9fdb14c-0000-4000-8000-000000000002"),
              title: "Alpinisme",
            },
          ],
          wikibidous: 20,
        },
        counterTo: null,
      },
      {
        tradeId: asTradeId(SENT_ID),
        status: "cancelled",
        createdAt: "2026-10-20T10:00:00+00:00",
        initiator: {
          playerId: asPlayerId(USER_ID),
          username: "Moi",
          cards: [],
          wikibidous: 50,
        },
        recipient: {
          playerId: asPlayerId(OTHER_ID),
          username: "LucasPerso",
          cards: [],
          wikibidous: 0,
        },
        counterTo: asTradeId(RECEIVED_ID),
      },
    ]);
  });

  it("sends one request", async () => {
    const { session, listRequests } = await sessionAnswering(listed([]));

    await listTrades(session);

    const [request, ...others] = listRequests();
    expect(others).toEqual([]);
    expect(request?.url.search).toBe("");
    expect(request?.headers.get("cookie")).toMatch(
      new RegExp(`^${AUTH_COOKIE_NAME}=base64-`),
    );
  });

  it("keeps only the trades in the status given, with a single request and no query", async () => {
    const { session, listRequests } = await sessionAnswering(
      listed([received, sent]),
    );

    const trades = await listTrades(session, "cancelled");

    expect(trades.map(({ tradeId }) => tradeId)).toEqual([asTradeId(SENT_ID)]);
    expect(listRequests()).toHaveLength(1);
    expect(listRequests()[0]?.url.search).toBe("");
  });

  it("keeps the proposed and the received trades in the status given", async () => {
    const proposed = { ...sent, status: "pending" };
    const { session } = await sessionAnswering(
      listed([received, proposed, { ...sent, status: "accepted" }]),
    );

    const trades = await listTrades(session, "pending");

    expect(trades.map(({ initiator }) => initiator.playerId)).toEqual([
      asPlayerId(OTHER_ID),
      asPlayerId(USER_ID),
    ]);
  });

  it("returns no trade when none is in the status given", async () => {
    const { session } = await sessionAnswering(listed([received, sent]));

    await expect(listTrades(session, "accepted")).resolves.toEqual([]);
  });

  it("returns no trade on an empty response", async () => {
    const { session } = await sessionAnswering(listed([]));

    await expect(listTrades(session)).resolves.toEqual([]);
  });

  it("fails with the game's reason", async () => {
    const { session } = await sessionAnswering({
      status: 500,
      body: { error: "Erreur serveur" },
    });

    const failure = listTrades(session);
    await expect(failure).rejects.toThrow(WikiMastersError);
    await expect(failure).rejects.toThrow(
      'Reading your trades failed (HTTP 500): {"error":"Erreur serveur"}',
    );
  });

  it("asks to sign in again on HTTP 401", async () => {
    const { session } = await sessionAnswering({
      status: 401,
      body: { error: "Non authentifié" },
    });

    await expect(listTrades(session)).rejects.toThrow(AuthRequiredError);
  });

  it("fails on an unexpected response", async () => {
    const { session } = await sessionAnswering({ status: 200, body: {} });

    await expect(listTrades(session)).rejects.toThrow(/unexpected response/);
  });
});
