import { describe, expect, it } from "vitest";
import { parseAuctionId, parseCardId } from "../core/index.js";
import {
  formatBid,
  formatDiscard,
  formatFavourite,
  formatLogin,
  formatRemoval,
  formatTag,
  formatWishlist,
} from "./output.js";

const cardId = parseCardId("093ba47b-6b5d-4d29-9992-c2bdc172f62c");
const card = {
  id: cardId,
  title: "Pointe de la Sambuy",
  rarity: "PC",
  owned: false,
};
const cards = [card];
const bid = {
  auctionId: parseAuctionId("d6669009-683d-44b6-b6e7-2c0960c37f2f"),
  amount: 359,
  balance: 7743,
};
const discard = { discarded: 3, gained: 3, balance: 7430, failed: [] };

describe("JSON output", () => {
  it("reports the auction id, the amount bid and the balance", () => {
    expect(JSON.parse(formatBid(bid, "json"))).toEqual({
      id: bid.auctionId,
      amount: 359,
      balance: 7743,
    });
  });

  it("lists the wishlist as an array of id, title, rarity and ownership", () => {
    expect(JSON.parse(formatWishlist(cards, "json"))).toEqual([
      { id: cardId, title: "Pointe de la Sambuy", rarity: "PC", owned: false },
    ]);
  });

  it("gives an empty array for an empty wishlist", () => {
    expect(formatWishlist([], "json")).toBe("[]");
  });

  it("reports a removal with the card id and whether it was removed", () => {
    expect(
      JSON.parse(formatRemoval({ cardId, removed: true }, "json")),
    ).toEqual({ id: cardId, removed: true });
    expect(
      JSON.parse(formatRemoval({ cardId, removed: false }, "json")),
    ).toEqual({ id: cardId, removed: false });
  });

  it("reports a favourite change with the card id, the state and whether it changed", () => {
    expect(
      JSON.parse(
        formatFavourite({ cardId, starred: true, changed: false }, "json"),
      ),
    ).toEqual({ id: cardId, starred: true, changed: false });
  });

  it("reports a label change with the card id, the label, the state and whether it changed", () => {
    expect(
      JSON.parse(
        formatTag(
          { cardId, label: "Histoire", tagged: true, changed: false },
          "json",
        ),
      ),
    ).toEqual({ id: cardId, label: "Histoire", tagged: true, changed: false });
  });

  it("reports a discard with its count, gain, balance and failures", () => {
    expect(JSON.parse(formatDiscard(discard, "json"))).toEqual(discard);
  });

  it("reports the logged-in user id", () => {
    expect(JSON.parse(formatLogin("user-id", "json"))).toEqual({
      userId: "user-id",
    });
  });
});

describe("text output", () => {
  it("prints the amount bid and the balance", () => {
    expect(formatBid(bid, "text")).toBe(
      `Bid 359 wikibidous on auction ${bid.auctionId}; balance 7743 wikibidous.`,
    );
  });

  it("prints the discard count, gain and balance", () => {
    expect(formatDiscard(discard, "text")).toBe(
      "Discarded 3 common cards for 3 wikibidous; balance 7430 wikibidous.",
    );
  });

  it("uses the singular for one card", () => {
    expect(formatDiscard({ ...discard, discarded: 1, gained: 1 }, "text")).toBe(
      "Discarded 1 common card for 1 wikibidou; balance 7430 wikibidous.",
    );
  });

  it("says when no common card was discarded", () => {
    expect(formatDiscard({ ...discard, discarded: 0, gained: 0 }, "text")).toBe(
      "No common card discarded; balance 7430 wikibidous.",
    );
  });

  it("lists the cards the site failed to discard", () => {
    expect(
      formatDiscard({ ...discard, failed: ["entry-id"] }, "text"),
    ).toContain('1 card could not be discarded: ["entry-id"]');
  });

  it("prints one line per wishlist card", () => {
    expect(formatWishlist(cards, "text")).toBe(
      `${cardId}  Pointe de la Sambuy (PC)`,
    );
  });

  it("marks the wishlist cards already in the collection", () => {
    expect(formatWishlist([{ ...card, owned: true }], "text")).toBe(
      `${cardId}  Pointe de la Sambuy (PC)  [owned]`,
    );
  });

  it("says when the wishlist is empty", () => {
    expect(formatWishlist([], "text")).toBe("The wishlist is empty.");
  });

  it("says when a card is marked as favourite", () => {
    expect(
      formatFavourite({ cardId, starred: true, changed: true }, "text"),
    ).toBe(`Card ${cardId} marked as favourite.`);
  });

  it("says when a card already was a favourite", () => {
    expect(
      formatFavourite({ cardId, starred: true, changed: false }, "text"),
    ).toBe(`Card ${cardId} was already a favourite.`);
  });

  it("says when a card is removed from the favourites", () => {
    expect(
      formatFavourite({ cardId, starred: false, changed: true }, "text"),
    ).toBe(`Card ${cardId} removed from the favourites.`);
  });

  it("says when a card was not a favourite", () => {
    expect(
      formatFavourite({ cardId, starred: false, changed: false }, "text"),
    ).toBe(`Card ${cardId} was not a favourite.`);
  });

  it("says when a card is labelled", () => {
    expect(
      formatTag(
        { cardId, label: "Histoire", tagged: true, changed: true },
        "text",
      ),
    ).toBe(`Card ${cardId} labelled "Histoire".`);
  });

  it("says when a card already had the label", () => {
    expect(
      formatTag(
        { cardId, label: "Histoire", tagged: true, changed: false },
        "text",
      ),
    ).toBe(`Card ${cardId} already had the label "Histoire".`);
  });
});
