import { WikiMastersError, apiFailure } from "./errors.js";
import type { Session } from "./session.js";

export interface EntryTag {
  entryId: string;
  labelId: string;
}

export interface EntryUntag extends EntryTag {
  removed: boolean;
}

export async function tagEntry(
  session: Session,
  entryId: string,
  labelId: string,
): Promise<EntryTag> {
  const { error, status } = await session.client
    .from("user_card_tags")
    .insert({ user_card_id: entryId, tag_id: labelId });
  if (error) {
    throw apiFailure(
      `Labelling entry ${entryId} with label ${labelId}`,
      status,
      error.message,
    );
  }
  return { entryId, labelId };
}

export async function untagEntry(
  session: Session,
  entryId: string,
  labelId: string,
): Promise<EntryUntag> {
  const action = `Removing label ${labelId} from entry ${entryId}`;
  const { error, status, count } = await session.client
    .from("user_card_tags")
    .delete({ count: "exact" })
    .eq("user_card_id", entryId)
    .eq("tag_id", labelId);
  if (error) throw apiFailure(action, status, error.message);
  if (count === null) {
    throw new WikiMastersError(
      `${action} returned no row count (HTTP ${status})`,
    );
  }
  return { entryId, labelId, removed: count > 0 };
}
