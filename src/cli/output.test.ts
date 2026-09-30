import { describe, expect, it } from 'vitest';
import { parseCardId } from '../core/index.js';
import { formatLogin, formatRemoval, formatWishlist } from './output.js';

const cardId = parseCardId('093ba47b-6b5d-4d29-9992-c2bdc172f62c');
const cards = [{ id: cardId, title: 'Pointe de la Sambuy', rarity: 'PC' }];

describe('JSON output', () => {
  it('lists the wishlist as an array of id, title and rarity', () => {
    expect(JSON.parse(formatWishlist(cards, 'json'))).toEqual([{ id: cardId, title: 'Pointe de la Sambuy', rarity: 'PC' }]);
  });

  it('gives an empty array for an empty wishlist', () => {
    expect(formatWishlist([], 'json')).toBe('[]');
  });

  it('reports a removal with the card id and whether it was removed', () => {
    expect(JSON.parse(formatRemoval({ cardId, removed: true }, 'json'))).toEqual({ id: cardId, removed: true });
    expect(JSON.parse(formatRemoval({ cardId, removed: false }, 'json'))).toEqual({ id: cardId, removed: false });
  });

  it('reports the logged-in user id', () => {
    expect(JSON.parse(formatLogin('user-id', 'json'))).toEqual({ userId: 'user-id' });
  });
});

describe('text output', () => {
  it('prints one line per wishlist card', () => {
    expect(formatWishlist(cards, 'text')).toBe(`${cardId}  Pointe de la Sambuy (PC)`);
  });

  it('says when the wishlist is empty', () => {
    expect(formatWishlist([], 'text')).toBe('The wishlist is empty.');
  });
});
