# WikiMasters game rules

Rules the user states and the API does not reveal. Record each one as soon as the user gives it.

| Rule | Used by |
|---|---|
| Discarding a card yields exactly 1 wikibidou, whatever its rarity. | `discardCommons` |
| Wikibidous are the currency bid in auctions, the way to buy a specific card. | — |
| The minimum bid on an auction is its `base_amount` while nobody has bid, else `max(ceil(1.1 × current_bid), current_bid + 1)`, computed in floating point as the site does (200 → 221). | `placeMinimumBid` |
