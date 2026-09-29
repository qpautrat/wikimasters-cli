import type { CardId } from './card-id.js';
import { WikiMastersError } from './errors.js';
import type { Session } from './session.js';

export interface WishlistRemoval {
  cardId: CardId;
  removed: boolean;
}

export async function removeFromWishlist(session: Session, cardId: CardId): Promise<WishlistRemoval> {
  const { error, status, count } = await session.client
    .from('wishlist_items')
    .delete({ count: 'exact' })
    .eq('user_id', session.userId)
    .eq('card_id', cardId);

  if (error) {
    throw new WikiMastersError(`Removing card ${cardId} from the wishlist failed (HTTP ${status}): ${error.message}`);
  }
  if (count === null) {
    throw new WikiMastersError(`Removing card ${cardId} from the wishlist returned no row count (HTTP ${status})`);
  }

  return { cardId, removed: count > 0 };
}
