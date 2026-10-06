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
- `addToWishlist`: `POST` with `{"user_id":"<user id>","card_id":"<card id>"}`; PostgREST answers with an empty body and `Content-Range: */*`; Firefox recorded the status as `0`. The core treats a unique violation (`23505`) as the card being already there.
- `removeFromWishlist`: `DELETE` filtered on `user_id` and `card_id` (capture). The core adds `Prefer: count=exact`, PostgREST's standard header, to get the number of deleted rows in `Content-Range`, `0` when the card was absent.

## `cards`: the card catalogue

Source: read-only query.

| Column | Meaning |
|---|---|
| `id` | card UUID |
| `wikipedia_title` | title of the Wikipedia article the card is built from |
| `rarity` | current rarity code; seen: `C`, `PC`, `R`, `SR`, `UR` |

- The whole catalogue is readable, owned or not: more than 100,000 cards.
- PostgREST turns every `*` of a `like`/`ilike` pattern into `%`, a backslash-escaped one included; an `imatch` regex keeps it literal. An anchored `imatch` alone hits the statement timeout (HTTP 500); paired with an `ilike` on the same column, it answers in under a second (observed 2026-10-05).
- `searchCards`: `GET` of `id, wikipedia_title, rarity`, ordered by `wikipedia_title` then `id`, filtered twice on `wikipedia_title`: `ilike.%<text>%`, with `%`, `_` and `\` escaped and `*` turned into `_`, and `imatch.<text>`, with the regex metacharacters escaped; limited to 51 to tell whether more than 50 cards match. Only then, a second read anchors both filters (`ilike.<text>`, `imatch.^<text>$`), limited to 50, to put the exact titles first.
- `showAuction` embeds it in `auctions` as `cards(wikipedia_title)` to give the auctioned card's title.
- `listRunningBids` embeds it the same way through `auction_bids` → `auctions`.
- `addToWishlist`: `GET` of `wikipedia_title, wishlist_items(card_id)`, filtered on `id` and `wishlist_items.user_id`, to refuse a card absent from the catalogue and skip one already wished.

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
| `obtained_at` | when the card was obtained |
| `eff_rarity_order` | rank of `snapshot_rarity`: `C` 0, `PC` 1, `R` 2, `SR` 3, `UR` 4, `L` 5 |

- The owned rarity is `snapshot_rarity`: it can differ from `cards.rarity`, and the site's collection filter and counts follow it.

- One row per owned card: no `card_id` appears twice.
- Putting a card up for auction deletes its row; cancelling the auction creates a new one, with a new `id` and `obtained_at` set to the cancellation time (observed 2026-10-05).
- Row-level security returns only the user's own rows.
- `listCollection`: `GET` of `card_id, snapshot_title, snapshot_rarity, count, starred, is_shiny, obtained_at, user_card_tags(tags(name))`, filtered on `user_id`, `count=gt.0` and, with a rarity, `snapshot_rarity`, ordered by `obtained_at` then `id`, paged by 1000.
- `discardCards`: `GET` of `id, card_id`, filtered on `user_id`, `card_id=in.(…)` and `count=gt.0`, to find the entry of each card to discard.
- `listWishlist` embeds it as `cards(user_cards(card_id))`, filtered on `cards.user_cards.user_id` and `cards.user_cards.count=gt.0`, to tell whether each wished card is owned. The `count` filter guards against a zero-copy row, never seen so far.
- `starCard` / `unstarCard`: `GET` of `id, starred`, filtered on `user_id`, `card_id` and `count=gt.0`, then, when `starred` differs, `PATCH user_cards?id=eq.<entry id>&starred=eq.<previous state>` with `{"starred":true}` / `{"starred":false}` and `Prefer: count=exact`; PostgREST answers `204`. Source: captures `star-card.har` and `unstar-card.har`, the interface filters the same `PATCH` on `id` only.

## `user_card_tags`: the labels put on collection entries

Source: read-only query, 2026-10-02.

| Column | Meaning |
|---|---|
| `user_card_id` | labelled collection entry, relation to `user_cards.id` |
| `tag_id` | the label, relation to `tags.id` |

- Row-level security returns only the user's own rows.
- `listCollection` embeds it in `user_cards` as `user_card_tags(tags(name))` to give each entry's label names.
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
- `listCollection`: reads `name` through the `user_card_tags(tags(name))` embed in `user_cards`.
- `tagCard` / `untagCard`: `GET` of `id, name` filtered on `user_id` and ordered by `name`, to find the label by its exact name or list the user's labels.

## `POST /api/user-cards/bulk-discard`: discard collection entries

Source: capture `discard-cards.har`, and a discard of an auctioned card's former entry (2026-10-05).

- Body `{"card_ids": [<user_cards.id>, …]}`: collection entry ids, not `cards.id`.
- Response `{"balance": <wikibidous after the discard>, "discarded_count": <n>, "failed": [{"card_id": <user_cards.id>, "error": <code>}, …]}`, HTTP 200 even when every card is refused. An entry that is no longer in the collection gets `card_not_owned`.
- Each discarded card yields exactly 1 wikibidou (game rule, stated by the user), so `discardCards` reports the gain as `discarded_count`.
- At most 100 ids per call: a larger batch gets HTTP 400 `{"error":"Maximum 100 cartes par requête"}` and discards nothing (observed 2026-10-02). `discardCards` sends batches of 100, reports the last response's `balance` and each `failed` entry as its card and `error` code, and fails on a response whose `discarded_count` and `failed` do not account for exactly the entries sent. `discardCards` reads the entries in batches of 100 card ids, all before the first discard.

## `auctions`: the auctions

Source: read-only queries, 2026-10-02 and 2026-10-05.

| Column | Meaning |
|---|---|
| `id` | auction UUID, also in the auction page URL `/marketplace/<id>` |
| `seller_id` | user who put the card up for auction |
| `status` | `active`, `settled_sold`, `settled_unsold`, `cancelled` |
| `end_at` | when bidding closes; an `active` auction past it awaits settlement |
| `base_amount` | starting price, which the seller can lower once |
| `current_bid` | highest bid, `null` while nobody has bid |
| `current_bidder_id` | author of `current_bid` |
| `card_id` | auctioned card, relation to `cards.id` |
| `snapshot_rarity` | rarity of the auctioned copy |
| `is_shiny` | whether the auctioned copy is shiny |

- `showAuction`: `GET` of `status, end_at, seller_id, base_amount, current_bid, current_bidder_id, snapshot_rarity, is_shiny, cards(wikipedia_title)` filtered on `id`.
- `listRunningBids` embeds it in `auction_bids` as `auctions!inner(end_at, current_bid, current_bidder_id, cards(wikipedia_title))`, filtered on `auctions.status=eq.active` and `auctions.end_at=gt.<now>`. A `GET` on `auctions` filtered through an `auction_bids!inner` embed times out (HTTP 500 `canceling statement due to statement timeout`, observed 2026-10-06).

## `auction_bids`: the bids

Source: read-only queries, 2026-10-06.

| Column | Meaning |
|---|---|
| `id` | bid UUID |
| `auction_id` | auction bid on, relation to `auctions.id` |
| `bidder_id` | author of the bid |
| `amount` | wikibidous bid |
| `placed_at` | when the bid was placed |

- Row-level security returns only the user's own bids: none of another bidder's, even on an auction they lead.
- One row per bid: an auction the user bid on several times appears several times.
- `listRunningBids`: `GET` of `auction_id, amount` and the `auctions` embed above, filtered on `bidder_id`, ordered by `placed_at` then `id`, paged by 1000; it keeps the highest `amount` per auction and sorts by `end_at`.

## `POST /api/marketplace/<auction id>/bid`: bid on an auction

Source: capture `place-bid.har`, the auction page's JavaScript for the error codes, and refused bids on the account (2026-10-06).

- Body `{"amount": <wikibidous>}`; response `{"auction_id", "current_bid": <amount>, "bidder_balance": <wikibidous left>}`.
- Refusal: a non-2xx status with `{"error": <message>, "code": …}`. The page handles `bid_too_low` (with `min`, the minimum it accepts), `insufficient_balance` and `human_verification_required` (the page then shows a captcha).
- Observed refusals: an ended auction gets HTTP 409 `{"error":"Cette enchère est terminée"}`, without `code`; a bid below the minimum gets HTTP 409 `{"error":"Mise trop basse (minimum 28 wikibidous)","code":"bid_too_low","min":28}`.
- The page hides the bid form from the seller and once `end_at` is past, but not from the current bidder.
- `placeBid`: sends the amount given, reports `current_bid` and `bidder_balance`, and reports a refusal with its body.
