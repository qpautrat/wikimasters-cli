import type { CardId } from "./card-id.js";
import { WikiMastersError, apiFailure } from "./errors.js";
import type { Session } from "./session.js";

export interface FavouriteChange {
  cardId: CardId;
  starred: boolean;
  changed: boolean;
}

interface CollectionEntry {
  id: string;
  starred: boolean;
}

async function setStarred(
  session: Session,
  cardId: CardId,
  starred: boolean,
): Promise<FavouriteChange> {
  const action = starred
    ? `Marking card ${cardId} as favourite`
    : `Removing card ${cardId} from the favourites`;

  const { data, error, status } = await session.client
    .from("user_cards")
    .select("id, starred")
    .eq("user_id", session.userId)
    .eq("card_id", cardId)
    .gt("count", 0)
    .maybeSingle<CollectionEntry>();
  if (error) {
    throw apiFailure(
      `Reading card ${cardId} in the collection`,
      status,
      error.message,
    );
  }
  if (!data) {
    throw new WikiMastersError(
      `Card ${cardId} is not in your collection; nothing was changed`,
    );
  }
  if (data.starred === starred) return { cardId, starred, changed: false };

  const update = await session.client
    .from("user_cards")
    .update({ starred }, { count: "exact" })
    .eq("id", data.id);
  if (update.error) {
    throw apiFailure(action, update.status, update.error.message);
  }
  if (update.count !== 1) {
    throw new WikiMastersError(
      `${action} changed ${update.count ?? "an unknown number of"} collection entries instead of 1 (HTTP ${update.status})`,
    );
  }
  return { cardId, starred, changed: true };
}

export function starCard(
  session: Session,
  cardId: CardId,
): Promise<FavouriteChange> {
  return setStarred(session, cardId, true);
}
