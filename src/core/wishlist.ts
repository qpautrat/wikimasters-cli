import type { CardId } from './card-id.js';
import { WikiMastersError, apiFailure } from './errors.js';
import type { Session } from './session.js';

export interface WishlistRemoval {
  cardId: CardId;
  removed: boolean;
}

export interface WishlistCard {
  id: CardId;
  title: string;
  rarity: string;
}

interface WishlistRow {
  card_id: string;
  cards: { id: string; wikipedia_title: string; rarity: string } | null;
}

export async function listWishlist(session: Session): Promise<WishlistCard[]> {
  const { data, error, status } = await session.client
    .from('wishlist_items')
    .select('card_id, cards(id, wikipedia_title, rarity)')
    .eq('user_id', session.userId)
    .order('created_at', { ascending: false })
    .overrideTypes<WishlistRow[], { merge: false }>();

  if (error) {
    throw apiFailure('Listing the wishlist', status, error.message);
  }

  return data.map(({ card_id, cards }) => {
    if (!cards) {
      throw new WikiMastersError(`Wishlist card ${card_id} has no readable card details`);
    }
    return { id: cards.id as CardId, title: cards.wikipedia_title, rarity: cards.rarity };
  });
}

export async function removeFromWishlist(session: Session, cardId: CardId): Promise<WishlistRemoval> {
  const { error, status, count } = await session.client
    .from('wishlist_items')
    .delete({ count: 'exact' })
    .eq('user_id', session.userId)
    .eq('card_id', cardId);

  if (error) {
    throw apiFailure(`Removing card ${cardId} from the wishlist`, status, error.message);
  }
  if (count === null) {
    throw new WikiMastersError(`Removing card ${cardId} from the wishlist returned no row count (HTTP ${status})`);
  }

  return { cardId, removed: count > 0 };
}
