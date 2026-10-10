# WikiMasters API used by the core

PostgREST tables live at `https://cyrxjeppjqsxxjayfrur.supabase.co/rest/v1/<table>`, called with the user's session JWT. Row-level security limits what a user can read.

Next.js routes live at `https://www.wiki-masters.com/api/...` and read the session from the `sb-<ref>-auth-token` cookie, not from an `Authorization` header. The core sends the whole session as one unchunked cookie, `base64-` followed by the base64url-encoded session JSON, the `@supabase/ssr` format. It also sends the browser's `Origin` and `Referer`.

## Auth

| Route | Used by | Source |
|---|---|---|
| `POST /auth/v1/token?grant_type=refresh_token` | `resumeSession`, through `supabase-js`: exchanges the refresh token for a session and returns a rotated refresh token | `supabase-js` |
| `https://www.wiki-masters.com/login` | `loginInBrowser`: page opened in Firefox for the user to sign in | site navigation |
| Cookies `sb-<ref>-auth-token`, `sb-<ref>-auth-token.<n>` | `loginInBrowser` and `refreshTokenFromAuthCookieChunks`: hold the refresh token after the user signs in on the site | Firefox profile after a manual sign-in |

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
| `category` | category taken from the Wikipedia article, `null` on some cards |
| `summary` | summary of the Wikipedia article |

- The whole catalogue is readable, owned or not: more than 100,000 cards.
- PostgREST turns every `*` of a `like`/`ilike` pattern into `%`, a backslash-escaped one included; an `imatch` regex keeps it literal. An anchored `imatch` alone hits the statement timeout (HTTP 500); paired with an `ilike` on the same column, it answers in under a second (observed 2026-10-05).
- `searchCards`: `GET` of `id, wikipedia_title, rarity`, ordered by `wikipedia_title` then `id`, filtered twice on `wikipedia_title`: `ilike.%<text>%`, with `%`, `_` and `\` escaped and `*` turned into `_`, and `imatch.<text>`, with the regex metacharacters escaped; limited to 51 to tell whether more than 50 cards match. With a field other than the title, both filters apply to `category` or `summary` instead, still ordered by `wikipedia_title` then `id` (observed 2026-10-09: `summary` and `category` answer in seconds).
- `showAuction` and `listAuctions` embed it in `auctions` as `cards(wikipedia_title)` to give the auctioned card's title.
- `listRunningBids` embeds it the same way through `auction_bids` → `auctions`.
- `addToWishlist`: `GET` of `wikipedia_title, wishlist_items(card_id)`, filtered on `id` and `wishlist_items.user_id`, to refuse a card absent from the catalogue and skip one already wished.

## `user_cards`: the collection

Source: read-only query, 2026-10-02.

| Column | Meaning |
|---|---|
| `id` | collection entry UUID, what `bulk-discard` and `POST /api/marketplace` take |
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
- `listCollection`: `GET` of `id, card_id, snapshot_title, snapshot_rarity, count, starred, is_shiny, obtained_at, user_card_tags(tags(name))`, filtered on `user_id`, `count=gt.0` and, with a rarity, `snapshot_rarity`, ordered by `obtained_at` then `id`, reading the requested page in one request: `offset` (page − 1) × limit and `limit` the limit. An `offset` beyond the rows answers `[]`; a `limit` of 2000 answers 2000 rows (observed 2026-10-10).
- `discardCards`: `GET` of `id, card_id`, filtered on `user_id`, `card_id=in.(…)` and `count=gt.0`, to find the entry of each card to discard.
- `createAuction`: `GET` of `id`, filtered on `user_id`, `card_id` and `count=gt.0`, to find the entry of the card to put up for auction.
- `listWishlist` embeds it as `cards(user_cards(card_id))`, filtered on `cards.user_cards.user_id` and `cards.user_cards.count=gt.0`, to tell whether each wished card is owned. The `count` filter guards against a zero-copy row, never seen so far.
- `starEntry`: `PATCH user_cards?id=eq.<entry id>` with `{"starred":true}` and `Prefer: count=exact`, as the interface sends it; PostgREST answers `204`. The row count is 0 for an unknown entry and for another player's entry, which row-level security hides; an id that is not a UUID answers `400` `invalid input syntax for type uuid` (observed 2026-10-10). Source: capture `star-card.har`.
- `unstarCard`: `GET` of `id, starred`, filtered on `user_id`, `card_id` and `count=gt.0`, then, when `starred` is true, `PATCH user_cards?id=eq.<entry id>&starred=eq.true` with `{"starred":false}` and `Prefer: count=exact`; PostgREST answers `204`. Source: capture `unstar-card.har`, the interface filters the same `PATCH` on `id` only.

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
- `listLabels`: `GET` of `id, name, color` filtered on `user_id` and ordered by `name`, in a single request.
- `tagCard` / `untagCard`: the `listLabels` read, to find the label by its exact name or list the user's labels.
- `createLabel`: `POST tags?select=id,name,color` with `{"user_id":"<user id>","name":"<name>"}`, plus `"color"` when given, and `Prefer: return=representation`; PostgREST answers `201` with the created row. Without a colour the game stores `#94a3b8`. A colour that is not hex gets HTTP 400 `23514` from the check constraint `tags_color_hex_check`. A name the user already has, regardless of case, gets HTTP 409 `23505` from the unique index `tags_user_name_lower_unique`, which `createLabel` reports. Source: the site's JavaScript for the request, runs on the account (2026-10-08, 2026-10-09, 2026-10-10) for the answers.

## `POST rpc/delete_tag`: delete a label

Source: the site's JavaScript of `/collection` for the request, runs on the account (2026-10-08) for the answers.

- `deleteLabel`: `POST /rest/v1/rpc/delete_tag` with `{"p_tag_id":"<tags.id>"}` as given, in a single request; PostgREST answers `204` with no body. The label's `user_card_tags` rows go with it.
- An id that is unknown or another user's gets HTTP 400 `P0001` `Tag not found or not owned by caller`.

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
- `listAuctions`: `GET` of `id` and the same columns, filtered on `status` when given, limited to `limit`, without `order`. An unknown `status` value returns `[]` (observed 2026-10-08). Without a status filter, a read with `limit=3` answers (observed 2026-10-08); each status holds more than 100,000 auctions, and a read of the whole table times out (observed 2026-10-05).
- `listRunningBids` embeds it in `auction_bids` as `auctions!inner(end_at, current_bid, current_bidder_id, cards(wikipedia_title))`, filtered on `auctions.status=eq.active` and `auctions.end_at=gt.<now>`; see `auction_bids` for the read. A `GET` on `auctions` filtered through an `auction_bids!inner` embed times out (HTTP 500 `canceling statement due to statement timeout`, observed 2026-10-06).

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
- `listRunningBids`: `GET` of `auction_id, amount, placed_at` and the `auctions` embed above, filtered on `bidder_id`, ordered by `placed_at` then `id`, reading the requested page in one request: `offset` (page − 1) × limit and `limit` the limit. An `offset` beyond the rows answers `[]` (observed 2026-10-10).

## `POST /api/marketplace/<auction id>/bid`: bid on an auction

Source: capture `place-bid.har`, the auction page's JavaScript for the error codes, and refused bids on the account (2026-10-06).

- Body `{"amount": <wikibidous>}`; response `{"auction_id", "current_bid": <amount>, "bidder_balance": <wikibidous left>}`.
- Refusal: a non-2xx status with `{"error": <message>, "code": …}`. The page handles `bid_too_low` (with `min`, the minimum it accepts), `insufficient_balance` and `human_verification_required` (the page then shows a captcha).
- Observed refusals: an ended auction gets HTTP 409 `{"error":"Cette enchère est terminée"}`, without `code`; a bid below the minimum gets HTTP 409 `{"error":"Mise trop basse (minimum 28 wikibidous)","code":"bid_too_low","min":28}`.
- The page hides the bid form from the seller and once `end_at` is past, but not from the current bidder.
- `placeBid`: sends the amount given, reports `current_bid` and `bidder_balance`, and reports a refusal with its body.

## `POST /api/marketplace`: put a collection entry up for auction

Source: the auction form's JavaScript, reached from `/collection`, and auctions created on the account (2026-10-09).

- Body `{"card_id": <user_cards.id>, "base_amount": <starting price>, "duration_minutes": <minutes>}`: the collection entry id, not `cards.id`. Response `{"auction_id": <auctions.id>}`, HTTP 200; the auction's `end_at` is `duration_minutes` after its creation.
- Refusal: a non-2xx status with `{"error": <message>, "code": …}`. The form handles `human_verification_required` (it then shows a captcha) and shows `error` otherwise.
- Observed refusal: a duration of 7 minutes gets HTTP 400 `{"error":"Durée invalide (entre 10 minutes et 12 heures)"}`.
- The form offers 10, 30, 60, 180, 360 and 720 minutes, refuses a starting price below 1, and disables itself once the user's active auctions reach `maxConcurrentAuctions` from `GET /api/marketplace/mine` (`{"sellingCount", "maxConcurrentAuctions"}`, 5 for a regular account).
- `createAuction`: sends the entry id, the starting price and the duration given, reports `auction_id`, and reports a refusal with its body.

## `DELETE /api/marketplace/<auction id>`: cancel an auction

Source: the auction page `/marketplace/<id>` and a cancellation on the account (2026-10-09).

- No body. Response `{"status": "cancelled"}`, HTTP 200; the auction's `status` becomes `cancelled` and the card returns to the seller's `user_cards` under a new entry.
- Refusal: a non-2xx status with `{"error": <message>}`. Observed: an already cancelled auction gets HTTP 409 `{"error":"Cette enchère n'est plus active"}`.
- `cancelAuction`: sends the auction id given, reports `status`, and reports a refusal with its body.

## `GET /api/marketplace/cards/<card id>/sales?scope=summary`: a card's average sale price

Source: the auction form, reached from `/collection`, and reads on the account (2026-10-09).

- `<card id>` is `cards.id`, owned or not. Response HTTP 200 `{"wikipedia_title", "summary", "isPro"}`; for an account that is not PRO, `summary` maps each rarity the card sold under to `{"average": <wikibidous>}`, e.g. `{"R":{"average":19},"PC":{"average":56}}`, and is `{}` for a card never sold. The route does not say over which period the average runs.
- Refusal: a non-2xx status with `{"error": <message>}`. Observed: an unknown card gets HTTP 404 `{"error":"Carte introuvable"}`.
- `readCardValues`: sends one request per card id given, in order, reports `wikipedia_title` and each rarity's `average`, and stops at the first refusal, reported with its body.

## `GET /api/marketplace`: search the auctions

Source: the `/marketplace` page's JavaScript and reads on the account (2026-10-05 and 2026-10-08).

- Query `page`, `limit`, `sort` and `q`, as the page's search field sends them: `limit=50`, `sort=recent` by default, `q` the trimmed text, left out when empty. The page also sends `mine=1` on its first load and one `rarity` per rarity filter.
- `q` matches `auctions.snapshot_search_document`, the card title and category in lower case without accents, regardless of case. Only `active` auctions came back.
- Response `{"auctions": [...], "page", "limit", "hasMore"}`. Each auction holds the `auctions` columns, `card` (the `cards` row, `wikipedia_title` included), `seller`, `current_bidder` and `owned`. No match gives `"auctions": []`.
- A `limit` above 50 gets HTTP 403 `{"code":"automation_limit","error":"Trop de requêtes automatisées. L'automatisation n'est pas autorisée — voir le règlement."}`; `limit=0` answers 50 auctions at most (observed 2026-10-08).
- `page` starts at 1 and gives the next `limit` auctions; a page beyond the matches answers `"auctions": []` and `"hasMore": false` (observed 2026-10-08).
- `searchAuctions`: sends the `page` given, the `limit` given, `sort=recent` and the trimmed text as `q`, left out when empty, maps each auction as `showAuction` does, `card` standing for `cards`, reports `hasMore`, and reports a refusal with its body.

## `GET /api/cards`: search the global collection

Source: the `/global-collection` page's JavaScript and reads on the account (2026-10-09).

- Query `page`, `q`, one `rarity` per rarity filter, `sort` and `wishlist=1`, as the page sends them. The page starts at `page=0`, `sort=rarity`, and offers the sorts `rarity`, `name`, `atk` and `def`; without `page` or `sort`, the route answers as with `page=0`. `page` counts from 0: `q=karmine&page=1` answers no card where `page=0` answers 3.
- `q` matches the card title and category, not the summary.
- Response `{"cards": [...], "total", "searchHasMore", "rarityCounts", "friendOwners", "ownedCardIds", "wishlistCardIds", "friendPendingOfferKeys"}`, at most 50 cards per page. Each card holds the `cards` columns, `wikipedia_title` and `rarity` included. `friendOwners` maps a found card id that at least one friend owns to those friends, `[{"id", "username", "rarities"}]`. `ownedCardIds` and `wishlistCardIds` list the found cards the user owns and wishes. `friendPendingOfferKeys` lists `<player id>:<card id>` keys, the card being one of the found cards; the page's JavaScript reads the player as the friend the offer is pending with.
- `total` and `rarityCounts` come without text (`2776906` cards, `{"C": …, "PC": …}`) and with `wishlist=1`; with a text, `total` is `null` and `rarityCounts` `{}`. The page's JavaScript also accepts `total` as a string. `searchHasMore` tells whether another page matches a text; without a text it is `false` whatever `total`.
- Observed answers to unusual parameters: `page=abc&sort=foo&rarity=XX` answers HTTP 200 with no card and `total` 0; `page=-1` answers the first page; `page=99999999999` answers no card, `rarityCounts` `null` and `"pageCapped": true`; `q=%'"(` gets HTTP 500 `{"error":"canceling statement due to statement timeout"}`.
- `searchGlobalCollection`: sends the text, page, rarities, sort and wishlist filter given, each left out when not given, reads `owned`, `wishlisted` and `friends` of each card from `ownedCardIds`, `wishlistCardIds` and `friendOwners`, reports `total`, `rarityCounts`, `friendPendingOfferKeys` and `searchHasMore`, and reports a refusal with its body.

## `GET /api/profile/<pseudo>/collection`: read a page of a player's collection

Source: the trade form's JavaScript on `/trades`, the profile page's on `/profile/<pseudo>`, and reads on the account (2026-10-09).

- The path takes the player's pseudo, URL-encoded. Query `page`, `sort`, `stats`, `pending`, and optionally `q`, one `rarity` per rarity filter, `tag_id` and `wishlisted_by_me=1`. The trade form sends `page` from 0 (its displayed page minus 1), `sort=rarity`, `stats=1` on its first page and `stats=0` after, and `pending=1`; the profile page offers `sort` `rarity`, `name` and `added`. Without `sort`, the route answers the same entries in the same order as with `sort=rarity`.
- `page` starts at 0 and gives the next 50 entries: `page=0` and `page=1` answer different entries. A page beyond the collection answers `"collection": []`; `page=abc` answers page 0.
- Response `{"collection": [...], "pendingTradeCardIds", "profileId", "total", "rarityCounts", "tagOptions"}`; with `stats=0`, `total` is `null`, `rarityCounts` `{}` and `tagOptions` `[]`. Each entry holds `id` (the `user_cards` id), `card_id`, `count`, `starred`, `is_shiny`, `obtained_at`, `user_id`, `owned_by_viewer`, `tags` (`id`, `name`, `color`…) and `card`, the `cards` row whose `rarity` is the owned rarity: an entry whose `snapshot_rarity` is `SR` while `cards.rarity` is `R` answers `"rarity":"SR"`.
- `wishlisted_by_me=1` keeps only the entries whose card is on the user's wishlist: with one card of the player's collection on the wishlist, it answers that entry alone.
- `pendingTradeCardIds` lists `cards.id` values: the trade form checks it against each entry's `card.id`.
- The route also answers a player who is not a friend. A player id instead of a pseudo gets HTTP 404 `{"error":"Profil introuvable"}`.
- `readProfileCollection`: sends the pseudo and `page` given, `sort` when given, `stats=0`, `pending=1`, the text as `q` when given, each rarity given and `wishlisted_by_me=1` when asked, maps each entry, reports whether `pendingTradeCardIds` holds its card and whether the page holds 50 entries, and reports a refusal with its body.
