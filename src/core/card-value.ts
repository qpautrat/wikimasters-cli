import type { CardId } from "./card-id.js";
import { COLLECTION_PAGE } from "./collection.js";
import { WikiMastersError } from "./errors.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export interface CardSale {
  price: number;
  settledAt: string;
}

export interface CardValue {
  id: CardId;
  sales: Record<string, CardSale[]>;
}

interface RecentSale {
  final_price: number;
  settled_at: string;
  rarity: string;
}

interface RecentSalesResponse {
  recent: RecentSale[];
}

function isRecentSale(value: unknown): value is RecentSale {
  return (
    typeof value === "object" &&
    value !== null &&
    "final_price" in value &&
    typeof value.final_price === "number" &&
    "settled_at" in value &&
    typeof value.settled_at === "string" &&
    "rarity" in value &&
    typeof value.rarity === "string"
  );
}

function isRecentSalesResponse(body: unknown): body is RecentSalesResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "recent" in body &&
    Array.isArray(body.recent) &&
    body.recent.every(isRecentSale)
  );
}

function salesByRarity(recent: readonly RecentSale[]): CardValue["sales"] {
  const sales: CardValue["sales"] = {};
  for (const { rarity, final_price, settled_at } of recent) {
    const raritySales = sales[rarity] ?? [];
    raritySales.push({ price: final_price, settledAt: settled_at });
    sales[rarity] = raritySales;
  }
  return sales;
}

async function readCardValue(
  session: Session,
  cookie: string,
  cardId: CardId,
): Promise<CardValue> {
  const action = `Reading the sales of card ${cardId}`;
  const body = await siteRequest(
    session,
    cookie,
    action,
    COLLECTION_PAGE,
    `/api/marketplace/cards/${cardId}/sales?scope=summary`,
    { method: "GET" },
  );
  if (!isRecentSalesResponse(body)) {
    throw new WikiMastersError(
      `${action} returned an unexpected response: ${JSON.stringify(body)}`,
    );
  }
  return { id: cardId, sales: salesByRarity(body.recent) };
}

export async function readCardValues(
  session: Session,
  cardIds: readonly CardId[],
): Promise<CardValue[]> {
  const cookie = await siteCookie(session);
  const values: CardValue[] = [];
  for (const cardId of cardIds) {
    values.push(await readCardValue(session, cookie, cardId));
  }
  return values;
}
