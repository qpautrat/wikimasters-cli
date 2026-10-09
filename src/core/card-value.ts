import type { CardId } from "./card-id.js";
import { COLLECTION_PAGE } from "./collection.js";
import { WikiMastersError } from "./errors.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export interface CardValue {
  id: CardId;
  title: string;
  averages: Record<string, number>;
}

interface SalesSummaryResponse {
  wikipedia_title: string;
  summary: Record<string, { average: number }>;
}

function isRarityAverage(value: unknown): value is { average: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "average" in value &&
    typeof value.average === "number"
  );
}

function isSalesSummaryResponse(body: unknown): body is SalesSummaryResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "wikipedia_title" in body &&
    typeof body.wikipedia_title === "string" &&
    "summary" in body &&
    typeof body.summary === "object" &&
    body.summary !== null &&
    Object.values(body.summary).every(isRarityAverage)
  );
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
  if (!isSalesSummaryResponse(body)) {
    throw new WikiMastersError(
      `${action} returned an unexpected response: ${JSON.stringify(body)}`,
    );
  }
  return {
    id: cardId,
    title: body.wikipedia_title,
    averages: Object.fromEntries(
      Object.entries(body.summary).map(([rarity, { average }]) => [
        rarity,
        average,
      ]),
    ),
  };
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
