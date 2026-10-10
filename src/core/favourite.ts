import { WikiMastersError, apiFailure } from "./errors.js";
import type { Session } from "./session.js";

export interface EntryFavourite {
  entryId: string;
  starred: boolean;
}

async function setEntryStarred(
  session: Session,
  entryId: string,
  starred: boolean,
): Promise<EntryFavourite> {
  const action = starred
    ? `Marking entry ${entryId} as favourite`
    : `Removing entry ${entryId} from the favourites`;
  const update = await session.client
    .from("user_cards")
    .update({ starred }, { count: "exact" })
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
  return { entryId, starred };
}

export function starEntry(
  session: Session,
  entryId: string,
): Promise<EntryFavourite> {
  return setEntryStarred(session, entryId, true);
}

export function unstarEntry(
  session: Session,
  entryId: string,
): Promise<EntryFavourite> {
  return setEntryStarred(session, entryId, false);
}
