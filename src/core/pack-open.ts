import { asCardId, type CardId } from "./card-id.js";
import { asEntryId, type EntryId } from "./entry-id.js";
import { unexpectedWriteResponse } from "./errors.js";
import { isObject } from "./object.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

const PULLS_PAGE = "/pulls";

export interface PackCard {
  cardId: CardId;
  entryId: EntryId;
  title: string;
  rarity: string;
}

function parsePackCard(card: unknown): PackCard | undefined {
  if (
    isObject(card) &&
    typeof card.id === "string" &&
    typeof card.user_card_id === "string" &&
    typeof card.wikipedia_title === "string" &&
    typeof card.rarity === "string"
  ) {
    return {
      cardId: asCardId(card.id),
      entryId: asEntryId(card.user_card_id),
      title: card.wikipedia_title,
      rarity: card.rarity,
    };
  }
  return undefined;
}

export async function openPack(session: Session): Promise<PackCard[]> {
  const action = "Opening a pack";
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    PULLS_PAGE,
    "/api/packs/open",
    { method: "POST" },
  );
  if (isObject(body) && Array.isArray(body.cards)) {
    const cards = body.cards.map(parsePackCard);
    if (cards.every((card) => card !== undefined)) return cards;
  }
  throw unexpectedWriteResponse(action, body, "opened");
}
