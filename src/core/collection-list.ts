import type { CardId } from "./card-id.js";
import { WikiMastersError, apiFailure } from "./errors.js";
import { pageRange, type PageRequest } from "./page.js";
import type { Session } from "./session.js";

export interface CollectionCard {
  entryId: string;
  id: CardId;
  title: string;
  rarity: string;
  copies: number;
  starred: boolean;
  shiny: boolean;
  labels: string[];
  obtainedAt: string;
}

export interface CollectionFilter {
  rarity?: string;
}

export interface CollectionPage {
  cards: CollectionCard[];
  full: boolean;
}

interface OwnedCardRow {
  id: string;
  card_id: string;
  snapshot_title: string;
  snapshot_rarity: string;
  count: number;
  starred: boolean;
  is_shiny: boolean;
  obtained_at: string;
  user_card_tags: { tags: { name: string } | null }[];
}

function labelsOf({ card_id, user_card_tags }: OwnedCardRow): string[] {
  return user_card_tags
    .map(({ tags }) => {
      if (!tags) {
        throw new WikiMastersError(
          `A label of card ${card_id} has no readable name`,
        );
      }
      return tags.name;
    })
    .sort((a, b) => a.localeCompare(b));
}

export async function listCollection(
  session: Session,
  request: PageRequest,
  { rarity }: CollectionFilter = {},
): Promise<CollectionPage> {
  let query = session.client
    .from("user_cards")
    .select(
      "id, card_id, snapshot_title, snapshot_rarity, count, starred, is_shiny, obtained_at, user_card_tags(tags(name))",
    )
    .eq("user_id", session.userId)
    .gt("count", 0);
  if (rarity !== undefined) query = query.eq("snapshot_rarity", rarity);
  const [from, to] = pageRange(request);
  const { data, error, status } = await query
    .order("obtained_at")
    .order("id")
    .range(from, to)
    .overrideTypes<OwnedCardRow[], { merge: false }>();
  if (error) throw apiFailure("Listing the collection", status, error.message);

  return {
    cards: data.map((row) => ({
      entryId: row.id,
      id: row.card_id as CardId,
      title: row.snapshot_title,
      rarity: row.snapshot_rarity,
      copies: row.count,
      starred: row.starred,
      shiny: row.is_shiny,
      labels: labelsOf(row),
      obtainedAt: row.obtained_at,
    })),
    full: data.length === request.limit,
  };
}
