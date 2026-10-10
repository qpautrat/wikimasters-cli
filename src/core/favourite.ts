import type { CardId } from "./card-id.js";
import { readCollectionEntry } from "./collection-entry.js";
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
  const entry = await readCollectionEntry<CollectionEntry>(
    session,
    cardId,
    "id, starred",
  );
  if (entry.starred === starred) return { cardId, starred, changed: false };

  const action = starred
    ? `Marking card ${cardId} as favourite`
    : `Removing card ${cardId} from the favourites`;
  const update = await session.client
    .from("user_cards")
    .update({ starred }, { count: "exact" })
    .eq("id", entry.id)
    .eq("starred", !starred);
  if (update.error) {
    throw apiFailure(action, update.status, update.error.message);
  }
  if (update.count === null) {
    throw new WikiMastersError(
      `${action} returned no row count (HTTP ${update.status})`,
    );
  }
  if (update.count === 0) {
    throw new WikiMastersError(
      `${action} found no entry to change: the collection entry changed meanwhile; nothing was changed`,
    );
  }
  return { cardId, starred, changed: true };
}

export interface EntryFavourite {
  entryId: string;
  starred: boolean;
}

export async function starEntry(
  session: Session,
  entryId: string,
): Promise<EntryFavourite> {
  const action = `Marking entry ${entryId} as favourite`;
  const update = await session.client
    .from("user_cards")
    .update({ starred: true }, { count: "exact" })
    .eq("id", entryId);
  if (update.error) {
    throw apiFailure(action, update.status, update.error.message);
  }
  if (update.count === null) {
    throw new WikiMastersError(
      `${action} returned no row count (HTTP ${update.status})`,
    );
  }
  if (update.count === 0) {
    throw new WikiMastersError(
      `${action} changed no entry: the entry is unknown or not yours; nothing was changed`,
    );
  }
  return { entryId, starred: true };
}

export function unstarCard(
  session: Session,
  cardId: CardId,
): Promise<FavouriteChange> {
  return setStarred(session, cardId, false);
}
