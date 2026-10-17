import { type CardId, parseCardId } from "./card-id.js";
import { asEntryId, type EntryId } from "./entry-id.js";
import { WikiMastersError } from "./errors.js";
import { parseInteger } from "./integer.js";
import { isObject } from "./object.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

const TRADES_PAGE = "/trades";

const UNTOUCHED = "no trade was proposed";

export type PlayerId = string & { readonly __brand: "PlayerId" };

export type TradeId = string & { readonly __brand: "TradeId" };

export type TradeWikibidous = number & {
  readonly __brand: "TradeWikibidous";
};

export interface TradeCard {
  entryId: EntryId;
  cardId: CardId;
}

export interface TradeProposal {
  recipientId: PlayerId;
  give: TradeCard[];
  take: TradeCard[];
  giveWikibidous: TradeWikibidous;
  takeWikibidous: TradeWikibidous;
  counterTo?: TradeId;
}

export interface ProposedTrade {
  tradeId: TradeId;
}

export function asPlayerId(raw: string): PlayerId {
  return raw as PlayerId;
}

export function asTradeId(raw: string): TradeId {
  return raw as TradeId;
}

export function parseTradeCard(raw: string): TradeCard {
  const separator = raw.indexOf(":");
  if (separator <= 0 || separator === raw.length - 1) {
    throw new WikiMastersError(
      `Invalid trade card ${JSON.stringify(raw)}: expected <entry-id>:<card-id>; ${UNTOUCHED}`,
    );
  }
  return {
    entryId: asEntryId(raw.slice(0, separator)),
    cardId: parseCardId(raw.slice(separator + 1)),
  };
}

export function parseTradeWikibidous(raw: string): TradeWikibidous {
  return parseInteger(raw, {
    subject: "trade amount",
    unit: "wikibidous",
    untouched: UNTOUCHED,
  }) as TradeWikibidous;
}

function proposedTradeId(body: unknown): string | undefined {
  if (!isObject(body) || !isObject(body.trade)) return undefined;
  return typeof body.trade.id === "string" ? body.trade.id : undefined;
}

export async function proposeTrade(
  session: Session,
  proposal: TradeProposal,
): Promise<ProposedTrade> {
  const action = `Proposing a trade to player ${proposal.recipientId}`;
  const items = [
    ...proposal.give.map((card) => ({ card, offeredBy: session.userId })),
    ...proposal.take.map((card) => ({
      card,
      offeredBy: proposal.recipientId,
    })),
  ].map(({ card, offeredBy }) => ({
    user_card_id: card.entryId,
    card_id: card.cardId,
    offered_by: offeredBy,
  }));
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    TRADES_PAGE,
    "/api/trades",
    {
      method: "POST",
      body: {
        recipient_id: proposal.recipientId,
        items,
        initiator_wikibidous: proposal.giveWikibidous,
        recipient_wikibidous: proposal.takeWikibidous,
        ...(proposal.counterTo === undefined
          ? {}
          : { parent_trade_id: proposal.counterTo }),
      },
    },
  );
  const tradeId = proposedTradeId(body);
  if (tradeId === undefined) {
    throw new WikiMastersError(
      `${action} returned an unexpected response, which may have proposed it: ${JSON.stringify(body)}`,
    );
  }
  return { tradeId: tradeId as TradeId };
}
