import { asCardId, type CardId } from "./card-id.js";
import { asEntryId, type EntryId } from "./entry-id.js";
import { WikiMastersError } from "./errors.js";
import { isObject } from "./object.js";
import { asPlayerId, type PlayerId } from "./player-id.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";
import { asTradeId, type TradeId } from "./trade-id.js";
import { TRADES_PAGE } from "./trades-page.js";

export interface TradeGivenCard {
  entryId: EntryId;
  cardId: CardId;
  title: string;
}

export interface TradeSide {
  playerId: PlayerId;
  username: string;
  cards: TradeGivenCard[];
  wikibidous: number;
}

export interface Trade {
  tradeId: TradeId;
  status: string;
  createdAt: string;
  initiator: TradeSide;
  recipient: TradeSide;
  counterTo: TradeId | null;
}

interface TradePlayer {
  id: string;
  username: string;
}

interface TradeItem {
  user_card_id: string;
  card_id: string;
  offered_by: string;
  card: { wikipedia_title: string };
}

interface TradeRow {
  id: string;
  status: string;
  created_at: string;
  initiator_id: string;
  recipient_id: string;
  parent_trade_id: string | null;
  initiator_wikibidous: number;
  recipient_wikibidous: number;
  initiator: TradePlayer;
  recipient: TradePlayer;
  items: TradeItem[];
}

function isTradePlayer(value: unknown): value is TradePlayer {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.username === "string"
  );
}

function isTradeItem(value: unknown): value is TradeItem {
  return (
    isObject(value) &&
    typeof value.user_card_id === "string" &&
    typeof value.card_id === "string" &&
    typeof value.offered_by === "string" &&
    isObject(value.card) &&
    typeof value.card.wikipedia_title === "string"
  );
}

function isTradeRow(value: unknown): value is TradeRow {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.status === "string" &&
    typeof value.created_at === "string" &&
    typeof value.initiator_id === "string" &&
    typeof value.recipient_id === "string" &&
    (value.parent_trade_id === null ||
      typeof value.parent_trade_id === "string") &&
    typeof value.initiator_wikibidous === "number" &&
    typeof value.recipient_wikibidous === "number" &&
    isTradePlayer(value.initiator) &&
    isTradePlayer(value.recipient) &&
    Array.isArray(value.items) &&
    value.items.every(isTradeItem)
  );
}

function sideOf(
  { id, username }: TradePlayer,
  wikibidous: number,
  items: readonly TradeItem[],
): TradeSide {
  return {
    playerId: asPlayerId(id),
    username,
    cards: items
      .filter(({ offered_by }) => offered_by === id)
      .map((item) => ({
        entryId: asEntryId(item.user_card_id),
        cardId: asCardId(item.card_id),
        title: item.card.wikipedia_title,
      })),
    wikibidous,
  };
}

function toTrade(row: TradeRow): Trade {
  return {
    tradeId: asTradeId(row.id),
    status: row.status,
    createdAt: row.created_at,
    initiator: sideOf(row.initiator, row.initiator_wikibidous, row.items),
    recipient: sideOf(row.recipient, row.recipient_wikibidous, row.items),
    counterTo:
      row.parent_trade_id === null ? null : asTradeId(row.parent_trade_id),
  };
}

export async function listTrades(
  session: Session,
  status?: string,
): Promise<Trade[]> {
  const action = "Reading your trades";
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    TRADES_PAGE,
    "/api/trades",
    { method: "GET" },
  );
  if (
    !isObject(body) ||
    !Array.isArray(body.trades) ||
    !body.trades.every(isTradeRow)
  ) {
    throw new WikiMastersError(
      `${action} returned an unexpected response: ${JSON.stringify(body)}`,
    );
  }
  const trades = body.trades.map(toTrade);
  return status === undefined
    ? trades
    : trades.filter((trade) => trade.status === status);
}
