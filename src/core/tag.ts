import type { CardId } from "./card-id.js";
import { readCollectionEntry } from "./collection-entry.js";
import { WikiMastersError, apiFailure, isUniqueViolation } from "./errors.js";
import { readLabels, type Label } from "./label.js";
import type { Session } from "./session.js";

export interface TagChange {
  cardId: CardId;
  label: string;
  tagged: boolean;
  changed: boolean;
}

interface TaggedEntry {
  id: string;
  user_card_tags: { tag_id: string }[];
}

function hasTag(entry: TaggedEntry, tag: Label): boolean {
  return entry.user_card_tags.some(({ tag_id }) => tag_id === tag.id);
}

async function findTag(session: Session, label: string): Promise<Label> {
  const data = await readLabels(session);
  const tag = data.find(({ name }) => name === label);
  if (tag) return tag;
  const labels =
    data.length === 0
      ? "you have no labels"
      : `your labels: ${data.map(({ name }) => JSON.stringify(name)).join(", ")}`;
  throw new WikiMastersError(
    `No label named ${JSON.stringify(label)}; ${labels}; nothing was changed`,
  );
}

export async function tagCard(
  session: Session,
  cardId: CardId,
  label: string,
): Promise<TagChange> {
  const entry = await readCollectionEntry<TaggedEntry>(
    session,
    cardId,
    "id, user_card_tags(tag_id)",
  );
  const tag = await findTag(session, label);
  if (hasTag(entry, tag)) {
    return { cardId, label, tagged: true, changed: false };
  }

  const { error, status } = await session.client
    .from("user_card_tags")
    .insert({ user_card_id: entry.id, tag_id: tag.id });
  if (isUniqueViolation(error)) {
    return { cardId, label, tagged: true, changed: false };
  }
  if (error) {
    throw apiFailure(
      `Labelling card ${cardId} ${JSON.stringify(label)}`,
      status,
      error.message,
    );
  }
  return { cardId, label, tagged: true, changed: true };
}

export async function untagCard(
  session: Session,
  cardId: CardId,
  label: string,
): Promise<TagChange> {
  const entry = await readCollectionEntry<TaggedEntry>(
    session,
    cardId,
    "id, user_card_tags(tag_id)",
  );
  const tag = await findTag(session, label);
  if (!hasTag(entry, tag)) {
    return { cardId, label, tagged: false, changed: false };
  }

  const action = `Removing label ${JSON.stringify(label)} from card ${cardId}`;
  const { error, status, count } = await session.client
    .from("user_card_tags")
    .delete({ count: "exact" })
    .eq("user_card_id", entry.id)
    .eq("tag_id", tag.id);
  if (error) throw apiFailure(action, status, error.message);
  if (count === null) {
    throw new WikiMastersError(
      `${action} returned no row count (HTTP ${status})`,
    );
  }
  return { cardId, label, tagged: false, changed: count > 0 };
}
