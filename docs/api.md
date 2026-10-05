# WikiMasters API used by the core

PostgREST tables live at `https://cyrxjeppjqsxxjayfrur.supabase.co/rest/v1/<table>`, called with the user's session JWT. Row-level security limits what a user can read.

Next.js routes live at `https://www.wiki-masters.com/api/...` and read the session from the `sb-<ref>-auth-token` cookie, not from an `Authorization` header. The core sends the whole session as one unchunked cookie, `base64-` followed by the base64url-encoded session JSON, the `@supabase/ssr` format. It also sends the browser's `Origin` and `Referer`.

## Auth

| Route | Used by | Source |
|---|---|---|
| `POST /auth/v1/token?grant_type=refresh_token` | `resumeSession`, through `supabase-js`: exchanges the refresh token for a session and returns a rotated refresh token | `supabase-js` |
| `https://www.wiki-masters.com/login` | `loginInBrowser`: page opened in Firefox for the user to sign in | site navigation |
| Cookies `sb-<ref>-auth-token`, `sb-<ref>-auth-token.<n>` | `loginInBrowser`: hold the refresh token after the user signs in on the site | Firefox profile after a manual sign-in |

## `wishlist_items`: the wishlist

Source: captures `withdraw-wishlist.har` (`DELETE`) and `add-wishlist.har` (`POST`), read-only query (columns).

| Column | Meaning |
|---|---|
| `user_id` | owner of the wishlist |
| `card_id` | the wished card, relation to `cards.id` |
| `created_at` | when the card was added |

- `listWishlist`: `GET`, filtered on `user_id`, ordered by `created_at.desc`, embeds `cards`.
- `addToWishlist`: `POST` with `{"user_id":"<user id>","card_id":"<card id>"}`; PostgREST answers with an empty body and `Content-Range: */*` (capture). The core treats a unique violation (`23505`) as the card being already there.
- `removeFromWishlist`: `DELETE` filtered on `user_id` and `card_id` (capture). The core adds `Prefer: count=exact`, PostgREST's standard header, to get the number of deleted rows in `Content-Range`, `0` when the card was absent.

## `cards`: the card catalogue

Source: read-only query.

| Column | Meaning |
|---|---|
| `id` | card UUID |
| `wikipedia_title` | title of the Wikipedia article the card is built from |
| `rarity` | current rarity code; seen: `C`, `PC`, `R`, `SR`, `UR` |

- The whole catalogue is readable, owned or not.
- `addToWishlist`: `GET` of `id, wishlist_items(card_id)`, filtered on `id` and `wishlist_items.user_id`, to refuse a card absent from the catalogue and skip one already wished.

## `user_cards`: the collection

Source: read-only query, 2026-10-02.

| Column | Meaning |
|---|---|
| `id` | collection entry UUID, what `bulk-discard` takes |
| `user_id` | owner |
| `card_id` | the owned card, relation to `cards.id` |
| `count` | number of copies owned, at least `1` in every row seen |
| `starred` | marked as favourite by the user |
| `is_shiny` | shiny variant |
| `snapshot_*` | the card's title, rarity and stats when it was obtained |
| `eff_rarity_order` | rank of `snapshot_rarity`: `C` 0, `PC` 1, `R` 2, `SR` 3, `UR` 4, `L` 5 |

- The owned rarity is `snapshot_rarity`: it can differ from `cards.rarity`, and the site's collection filter and counts follow it.

- One row per owned card: no `card_id` appears twice.
- Row-level security returns only the user's own rows.
- `discardCommons`: `GET`, filtered on `user_id`, `snapshot_rarity=eq.C`, `starred=is.false`, `is_shiny=is.false`, `count=gt.0` and, embedding `user_card_tags(tag_id)`, `user_card_tags=is.null`, paged by 1000.
- `listWishlist` embeds it as `cards(user_cards(card_id))`, filtered on `cards.user_cards.user_id` and `cards.user_cards.count=gt.0`, to tell whether each wished card is owned. The `count` filter guards against a zero-copy row, never seen so far.
- `starCard` / `unstarCard`: `GET` of `id, starred`, filtered on `user_id`, `card_id` and `count=gt.0`, then, when `starred` differs, `PATCH user_cards?id=eq.<entry id>&starred=eq.<previous state>` with `{"starred":true}` / `{"starred":false}` and `Prefer: count=exact`; PostgREST answers `204`. Source: captures `star-card.har` and `unstar-card.har`, the interface filters the same `PATCH` on `id` only.

## `user_card_tags`: the labels put on collection entries

Source: read-only query, 2026-10-02.

| Column | Meaning |
|---|---|
| `user_card_id` | labelled collection entry, relation to `user_cards.id` |
| `tag_id` | the label, relation to `tags.id` |

- Row-level security returns only the user's own rows.
- `discardCommons` embeds it in `user_cards` to keep labelled entries out of the discard.
- `tagCard`: `GET user_cards` of `id, user_card_tags(tag_id)`, filtered on `user_id`, `card_id` and `count=gt.0`, then `GET tags` of `id, name` filtered on `user_id`, then, when the entry lacks the label, `POST user_card_tags` with `{"user_card_id":"<entry id>","tag_id":"<label id>"}`; PostgREST answers `201` with no body. Source: capture `tag-card.har`.
- `untagCard`: the same two `GET`, then, when the entry has the label, `DELETE user_card_tags?user_card_id=eq.<entry id>&tag_id=eq.<label id>` with `Prefer: count=exact`; PostgREST answers `204`, and a count of `0` means the label was removed meanwhile. Source: capture `untag-card.har`.

## `tags`: the labels the user created

Source: read-only query, 2026-10-05.

| Column | Meaning |
|---|---|
| `id` | label UUID |
| `user_id` | owner |
| `name` | label name shown in the interface |
| `color` | hex colour shown in the interface |
| `created_at` | creation time |

- Row-level security returns only the user's own rows.
- `tagCard` / `untagCard`: `GET` of `id, name` filtered on `user_id` and ordered by `name`, to find the label by its exact name or list the user's labels.

## `rpc/get_my_profile`: the signed-in user's profile

Source: capture `discard-cards.har`.

- `POST` with an empty JSON body; returns one object holding, among others, `username` and `wikibidous_balance`.
- `discardCommons`: reads `wikibidous_balance` only when there is nothing to discard; otherwise the last `bulk-discard` response gives the balance.

## `POST /api/user-cards/bulk-discard`: discard collection entries

Source: capture `discard-cards.har`.

- Body `{"card_ids": [<user_cards.id>, …]}`: collection entry ids, not `cards.id`.
- Response `{"balance": <wikibidous after the discard>, "discarded_count": <n>, "failed": [...]}`; the capture only shows an empty `failed`.
- Each discarded card yields exactly 1 wikibidou (game rule, stated by the user), so `discardCommons` reports the gain as `discarded_count`.
- At most 100 ids per call: a larger batch gets HTTP 400 `{"error":"Maximum 100 cartes par requête"}` and discards nothing (observed 2026-10-02). `discardCommons` sends batches of 100.

## `GET /api/my-collection`: the collection page

Source: capture `discard-cards.har`.

- Query `sort=rarity&rarity=<code>&page=<n>&stats=0`; returns `collection` (one page of entries with their card) and `pendingTradeCardIds`, the cards engaged in a pending trade, empty in the capture.
- `discardCommons`: reads `pendingTradeCardIds` and keeps every entry whose `id` or `card_id` it lists, the capture not telling which of the two it holds.

## `auctions`: the auctions

Source: read-only query, 2026-10-02.

| Column | Meaning |
|---|---|
| `id` | auction UUID, also in the auction page URL `/marketplace/<id>` |
| `seller_id` | user who put the card up for auction |
| `status` | `active`, `settled_sold`, `settled_unsold`, `cancelled` |
| `end_at` | when bidding closes; an `active` auction past it awaits settlement |
| `base_amount` | starting price, which the seller can lower once |
| `current_bid` | highest bid, `null` while nobody has bid |
| `current_bidder_id` | author of `current_bid` |

- `placeMinimumBid`: `GET` filtered on `id`, to check the auction is running and not the user's own, and to compute the minimum bid.

## `POST /api/marketplace/<auction id>/bid`: bid on an auction

Source: capture `place-bid.har`, and the auction page's JavaScript for the error codes.

- Body `{"amount": <wikibidous>}`; response `{"auction_id", "current_bid": <amount>, "bidder_balance": <wikibidous left>}`.
- Refusal: a non-2xx status with `{"error": <message>, "code": …}`. The page handles `bid_too_low` (with `min`, the minimum it accepts), `insufficient_balance` and `human_verification_required` (the page then shows a captcha).
- The page hides the bid form from the seller and once `end_at` is past, but not from the current bidder.
- `placeMinimumBid`: sends the minimum bid and reports `bidder_balance`.
