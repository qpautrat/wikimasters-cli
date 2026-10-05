import type { CardId } from "./card-id.js";
import type { CatalogueCard } from "./card-search.js";
import { WikiMastersError, apiFailure, isUniqueViolation } from "./errors.js";
import type { Session } from "./session.js";

export interface WishlistRemoval {
  cardId: CardId;
  removed: boolean;
}

export interface WishlistAddition {
  cardId: CardId;
  title: string;
  added: boolean;
}

export interface WishlistCard extends CatalogueCard {
  owned: boolean;
}

interface WishlistRow {
  card_id: string;
  cards: {
    id: string;
    wikipedia_title: string;
    rarity: string;
    user_cards: { card_id: string }[];
  } | null;
}

export async function listWishlist(session: Session): Promise<WishlistCard[]> {
  const { data, error, status } = await session.client
    .from("wishlist_items")
    .select("card_id, cards(id, wikipedia_title, rarity, user_cards(card_id))")
    .eq("user_id", session.userId)
    .eq("cards.user_cards.user_id", session.userId)
    .gt("cards.user_cards.count", 0)
    .order("created_at", { ascending: false })
    .overrideTypes<WishlistRow[], { merge: false }>();

  if (error) {
    throw apiFailure("Listing the wishlist", status, error.message);
  }

  return data.map(({ card_id, cards }) => {
    if (!cards) {
      throw new WikiMastersError(
        `Wishlist card ${card_id} has no readable card details`,
      );
    }
    return {
      id: cards.id as CardId,
      title: cards.wikipedia_title,
      rarity: cards.rarity,
      owned: cards.user_cards.length > 0,
    };
  });
}

interface WishlistedCatalogueRow {
  wikipedia_title: string;
  wishlist_items: { card_id: string }[];
}

export async function addToWishlist(
  session: Session,
  cardId: CardId,
): Promise<WishlistAddition> {
  const { data, error, status } = await session.client
    .from("cards")
    .select("wikipedia_title, wishlist_items(card_id)")
    .eq("id", cardId)
    .eq("wishlist_items.user_id", session.userId)
    .maybeSingle<WishlistedCatalogueRow>();
  if (error) {
    throw apiFailure(
      `Reading card ${cardId} in the catalogue`,
      status,
      error.message,
    );
  }
  if (!data) {
    throw new WikiMastersError(
      `Card ${cardId} is not in the card catalogue; nothing was changed`,
    );
  }
  const title = data.wikipedia_title;
  if (data.wishlist_items.length > 0) return { cardId, title, added: false };

  const insert = await session.client
    .from("wishlist_items")
    .insert({ user_id: session.userId, card_id: cardId });
  if (isUniqueViolation(insert.error)) return { cardId, title, added: false };
  if (insert.error) {
    throw apiFailure(
      `Adding card ${cardId} to the wishlist`,
      insert.status,
      insert.error.message,
    );
  }
  return { cardId, title, added: true };
}

export async function removeFromWishlist(
  session: Session,
  cardId: CardId,
): Promise<WishlistRemoval> {
  const { error, status, count } = await session.client
    .from("wishlist_items")
    .delete({ count: "exact" })
    .eq("user_id", session.userId)
    .eq("card_id", cardId);

  if (error) {
    throw apiFailure(
      `Removing card ${cardId} from the wishlist`,
      status,
      error.message,
    );
  }
  if (count === null) {
    throw new WikiMastersError(
      `Removing card ${cardId} from the wishlist returned no row count (HTTP ${status})`,
    );
  }

  return { cardId, removed: count > 0 };
}
