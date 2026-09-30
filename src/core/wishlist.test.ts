import { describe, expect, it } from 'vitest';
import { parseCardId } from './card-id.js';
import { WikiMastersError } from './errors.js';
import { resumeSession } from './session.js';
import { ACCESS_TOKEN, USER_ID, fakeFetch, tokenRefresh, type Route } from './testing/fake-supabase.js';
import { listWishlist, removeFromWishlist } from './wishlist.js';

const cardId = parseCardId('3fc9a132-31db-4b14-832c-04823e02113d');

function wishlistDelete(deletedRows: number): Route {
  return ({ method, url }) =>
    method === 'DELETE' && url.pathname === '/rest/v1/wishlist_items'
      ? { status: 204, headers: { 'content-range': `*/${deletedRows}` } }
      : undefined;
}

async function sessionWith(...routes: Route[]) {
  const { fetch, requests } = fakeFetch(tokenRefresh, ...routes);
  const session = await resumeSession({ anonKey: 'anon-key', refreshToken: 'stored-token', fetch });
  return { session, requests };
}

describe('removeFromWishlist', () => {
  it('deletes the wishlist item of the signed-in user for that card', async () => {
    const { session, requests } = await sessionWith(wishlistDelete(1));

    const result = await removeFromWishlist(session, cardId);

    expect(result).toEqual({ cardId, removed: true });
    const request = requests.find(({ method }) => method === 'DELETE');
    expect(request?.url.searchParams.get('user_id')).toBe(`eq.${USER_ID}`);
    expect(request?.url.searchParams.get('card_id')).toBe(`eq.${cardId}`);
    expect(request?.headers.get('prefer')).toContain('count=exact');
    expect(request?.headers.get('authorization')).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it('succeeds without change when the card is already absent', async () => {
    const { session } = await sessionWith(wishlistDelete(0));

    await expect(removeFromWishlist(session, cardId)).resolves.toEqual({ cardId, removed: false });
  });

  it('reports the HTTP status when the API fails', async () => {
    const { session } = await sessionWith(({ method }) =>
      method === 'DELETE' ? { status: 525, body: { message: 'SSL handshake failed' } } : undefined,
    );

    await expect(removeFromWishlist(session, cardId)).rejects.toThrow(/HTTP 525/);
  });
});

describe('parseCardId', () => {
  it('normalises a UUID', () => {
    expect(parseCardId(' 3FC9A132-31DB-4B14-832C-04823E02113D ')).toBe(cardId);
  });

  it('rejects anything that is not a UUID', () => {
    expect(() => parseCardId('Pointe d’Arcalod')).toThrow(WikiMastersError);
  });
});

function wishlistSelect(rows: unknown[]): Route {
  return ({ method, url }) =>
    method === 'GET' && url.pathname === '/rest/v1/wishlist_items' ? { status: 200, body: rows } : undefined;
}

describe('listWishlist', () => {
  it('lists the cards of the signed-in user, most recently added first', async () => {
    const { session, requests } = await sessionWith(
      wishlistSelect([
        { card_id: cardId, cards: { id: cardId, wikipedia_title: 'Pointe d’Arcalod', rarity: 'PC' } },
        { card_id: '3dec5858-2054-4b3a-98f9-dfc35180165e', cards: { id: '3dec5858-2054-4b3a-98f9-dfc35180165e', wikipedia_title: 'Cervin', rarity: 'UR' } },
      ]),
    );

    await expect(listWishlist(session)).resolves.toEqual([
      { id: cardId, title: 'Pointe d’Arcalod', rarity: 'PC' },
      { id: '3dec5858-2054-4b3a-98f9-dfc35180165e', title: 'Cervin', rarity: 'UR' },
    ]);
    const request = requests.find(({ method }) => method === 'GET');
    expect(request?.url.searchParams.get('user_id')).toBe(`eq.${USER_ID}`);
    expect(request?.url.searchParams.get('order')).toBe('created_at.desc');
    expect(request?.url.searchParams.get('select')).toContain('cards(id,wikipedia_title,rarity)');
  });

  it('returns an empty list for an empty wishlist', async () => {
    const { session } = await sessionWith(wishlistSelect([]));

    await expect(listWishlist(session)).resolves.toEqual([]);
  });

  it('fails when a card of the wishlist cannot be read', async () => {
    const { session } = await sessionWith(wishlistSelect([{ card_id: cardId, cards: null }]));

    await expect(listWishlist(session)).rejects.toThrow(WikiMastersError);
  });
});
