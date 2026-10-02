# WikiMasters API used by the core

PostgREST tables live at `https://cyrxjeppjqsxxjayfrur.supabase.co/rest/v1/<table>`, called with the user's session JWT. Row-level security limits what a user can read.

## Auth

| Route | Used by | Source |
|---|---|---|
| `POST /auth/v1/token?grant_type=refresh_token` | `resumeSession`, through `supabase-js`: exchanges the refresh token for a session and returns a rotated refresh token | `supabase-js` |
| `https://www.wiki-masters.com/login` | `loginInBrowser`: page opened in Firefox for the user to sign in | site navigation |
| Cookies `sb-<ref>-auth-token`, `sb-<ref>-auth-token.<n>` | `loginInBrowser`: hold the refresh token after the user signs in on the site | Firefox profile after a manual sign-in |

## `wishlist_items`: the wishlist

Source: capture `withdraw-wishlist.har` (`DELETE`), read-only query (columns).

| Column | Meaning |
|---|---|
| `user_id` | owner of the wishlist |
| `card_id` | the wished card, relation to `cards.id` |
| `created_at` | when the card was added |

- `listWishlist`: `GET`, filtered on `user_id`, ordered by `created_at.desc`, embeds `cards`.
- `removeFromWishlist`: `DELETE` filtered on `user_id` and `card_id` (capture). The core adds `Prefer: count=exact`, PostgREST's standard header, to get the number of deleted rows in `Content-Range`, `0` when the card was absent.

## `cards`: the card catalogue

Source: read-only query.

| Column | Meaning |
|---|---|
| `id` | card UUID |
| `wikipedia_title` | title of the Wikipedia article the card is built from |
| `rarity` | current rarity code; seen: `C`, `PC`, `R`, `SR`, `UR` |

## `user_cards`: the collection

Source: read-only query, 2026-10-02.

| Column | Meaning |
|---|---|
| `user_id` | owner |
| `card_id` | the owned card, relation to `cards.id` |
| `count` | number of copies owned, at least `1` in every row seen |
| `snapshot_*` | the card's title, rarity and stats when it was obtained |

- One row per owned card: no `card_id` appears twice.
- Row-level security returns only the user's own rows.
- `listWishlist` embeds it as `cards(user_cards(card_id))`, filtered on `cards.user_cards.user_id` and `cards.user_cards.count=gt.0`, to tell whether each wished card is owned. The `count` filter guards against a zero-copy row, never seen so far.
