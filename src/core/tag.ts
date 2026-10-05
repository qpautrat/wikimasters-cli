import type { CardId } from "./card-id.js";
import { WikiMastersError, apiFailure } from "./errors.js";
import type { Session } from "./session.js";

export interface TagChange {
  cardId: CardId;
  label: string;
  tagged: boolean;
  changed: boolean;
}

interface Tag {
  id: string;
  name: string;
}

interface TaggedEntry {
  id: string;
  user_card_tags: { tag_id: string }[];
}

async function readEntry(
  session: Session,
  cardId: CardId,
): Promise<TaggedEntry> {
  const { data, error, status } = await session.client
    .from("user_cards")
    .select("id, user_card_tags(tag_id)")
    .eq("user_id", session.userId)
    .eq("card_id", cardId)
    .gt("count", 0)
    .maybeSingle<TaggedEntry>();
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
  return data;
}

async function findTag(session: Session, label: string): Promise<Tag> {
  const { data, error, status } = await session.client
    .from("tags")
    .select("id, name")
    .eq("user_id", session.userId)
    .order("name")
    .overrideTypes<Tag[], { merge: false }>();
  if (error) throw apiFailure("Reading your labels", status, error.message);
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
  const entry = await readEntry(session, cardId);
  const tag = await findTag(session, label);
  if (entry.user_card_tags.some(({ tag_id }) => tag_id === tag.id)) {
    return { cardId, label, tagged: true, changed: false };
  }

  const { error, status } = await session.client
    .from("user_card_tags")
    .insert({ user_card_id: entry.id, tag_id: tag.id });
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
  const entry = await readEntry(session, cardId);
  const tag = await findTag(session, label);

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
