import type { CardId } from "./card-id.js";
import { WikiMastersError, apiFailure } from "./errors.js";
import type { Session } from "./session.js";

export async function readCollectionEntry<Entry>(
  session: Session,
  cardId: CardId,
  columns: string,
): Promise<Entry> {
  const { data, error, status } = await session.client
    .from("user_cards")
    .select(columns)
    .eq("user_id", session.userId)
    .eq("card_id", cardId)
    .gt("count", 0)
    .maybeSingle<Entry>();
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
