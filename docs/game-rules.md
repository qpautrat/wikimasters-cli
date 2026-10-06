# WikiMasters game rules

Rules the API enforces without revealing them, as the user states them. Record each one as soon as the user gives it.

| Rule | Used by |
|---|---|
| Discarding a card yields exactly 1 wikibidou, whatever its rarity. | `discardCards` |
| Wikibidous are the currency bid in auctions, the way to buy a specific card. | — |
| A card engaged in an auction or a trade is temporarily removed from the collection, so it cannot be discarded. | — |
| An auction that has ended, or one's own auction, refuses every bid. | — |
| The minimum bid on an auction is its `base_amount` while nobody has bid, else `max(ceil(1.1 × current_bid), current_bid + 1)`, computed in floating point as the site does (200 → 221). | — |
