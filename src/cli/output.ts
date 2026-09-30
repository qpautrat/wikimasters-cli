import type { WishlistCard, WishlistRemoval } from '../core/index.js';

export type Format = 'text' | 'json';

export function formatLogin(userId: string, format: Format): string {
  return format === 'json' ? JSON.stringify({ userId }) : `Logged in as user ${userId}.`;
}

export function formatWishlist(cards: readonly WishlistCard[], format: Format): string {
  if (format === 'json') {
    return JSON.stringify(cards.map(({ id, title, rarity }) => ({ id, title, rarity })));
  }
  if (cards.length === 0) return 'The wishlist is empty.';
  return cards.map(({ id, title, rarity }) => `${id}  ${title} (${rarity})`).join('\n');
}

export function formatRemoval({ cardId, removed }: WishlistRemoval, format: Format): string {
  if (format === 'json') return JSON.stringify({ id: cardId, removed });
  return removed ? `Card ${cardId} removed from the wishlist.` : `Card ${cardId} was not in the wishlist.`;
}
