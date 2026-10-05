import { describe, expect, it } from "vitest";
import { parseAuctionId, parseCardId } from "../core/index.js";
import {
  formatAddition,
  formatBid,
  formatCollection,
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
const owned = {
  id: cardId,
  title: "Pointe de la Sambuy",
  rarity: "C",
  copies: 1,
  starred: false,
  shiny: false,
  labels: [],
  obtainedAt: "2026-09-18T23:42:15.692426+00:00",
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

  it("lists the collection as an array of cards with each attribute in its own field", () => {
    expect(JSON.parse(formatCollection([owned], "json"))).toEqual([
      {
        id: cardId,
        title: "Pointe de la Sambuy",
        rarity: "C",
        copies: 1,
        starred: false,
        shiny: false,
        labels: [],
        obtainedAt: "2026-09-18T23:42:15.692426+00:00",
      },
    ]);
  });

  it("gives an empty array for an empty collection", () => {
    expect(formatCollection([], "json", "UR")).toBe("[]");
  });

  it("gives an empty array for an empty wishlist", () => {
    expect(formatWishlist([], "json")).toBe("[]");
  });

  it("reports an addition with the card id, its title and whether it was added", () => {
    expect(
      JSON.parse(
        formatAddition({ cardId, title: card.title, added: true }, "json"),
      ),
    ).toEqual({ id: cardId, title: "Pointe de la Sambuy", added: true });
    expect(
      JSON.parse(
        formatAddition({ cardId, title: card.title, added: false }, "json"),
      ),
    ).toEqual({ id: cardId, title: "Pointe de la Sambuy", added: false });
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

  it("reports a discard with its count, gain, balance and refused cards", () => {
    const reason = "card_not_owned";
    expect(
      JSON.parse(
        formatDiscard({ ...discard, failed: [{ cardId, reason }] }, "json"),
      ),
    ).toEqual({ ...discard, failed: [{ id: cardId, reason }] });
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
      "Discarded 3 cards for 3 wikibidous; balance 7430 wikibidous.",
    );
  });

  it("uses the singular for one card", () => {
    expect(formatDiscard({ ...discard, discarded: 1, gained: 1 }, "text")).toBe(
      "Discarded 1 card for 1 wikibidou; balance 7430 wikibidous.",
    );
  });

  it("says when no card was discarded", () => {
    expect(formatDiscard({ ...discard, discarded: 0, gained: 0 }, "text")).toBe(
      "No card discarded; balance 7430 wikibidous.",
    );
  });

  it("names each card the game refused to discard with its reason", () => {
    expect(
      formatDiscard(
        {
          ...discard,
          failed: [{ cardId, reason: "card_not_owned" }],
        },
        "text",
      ).split("\n"),
    ).toEqual([
      "Discarded 3 cards for 3 wikibidous; balance 7430 wikibidous.",
      `Card ${cardId} could not be discarded: card_not_owned`,
    ]);
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

  it("prints one line per collection card", () => {
    expect(formatCollection([owned], "text")).toBe(
      `${cardId}  Pointe de la Sambuy (C)  x1  obtained 2026-09-18T23:42:15.692426+00:00`,
    );
  });

  it("marks the favourite, shiny and labelled collection cards", () => {
    expect(
      formatCollection(
        [
          {
            ...owned,
            copies: 2,
            starred: true,
            shiny: true,
            labels: ["Lieux", "Montagnes"],
          },
        ],
        "text",
      ),
    ).toBe(
      `${cardId}  Pointe de la Sambuy (C)  x2  obtained 2026-09-18T23:42:15.692426+00:00  [favourite]  [shiny]  [labels: "Lieux", "Montagnes"]`,
    );
  });

  it("says when the collection is empty", () => {
    expect(formatCollection([], "text")).toBe("The collection is empty.");
  });

  it("says when the collection holds no card of the requested rarity", () => {
    expect(formatCollection([], "text", "UR")).toBe(
      "The collection holds no card of rarity UR.",
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

  it("says when a card is added to the wishlist", () => {
    expect(
      formatAddition({ cardId, title: card.title, added: true }, "text"),
    ).toBe(`Card ${cardId} (Pointe de la Sambuy) added to the wishlist.`);
  });

  it("says when a card was already in the wishlist", () => {
    expect(
      formatAddition({ cardId, title: card.title, added: false }, "text"),
    ).toBe(`Card ${cardId} (Pointe de la Sambuy) was already in the wishlist.`);
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

  it("says when a label is removed from a card", () => {
    expect(
      formatTag(
        { cardId, label: "Histoire", tagged: false, changed: true },
        "text",
      ),
    ).toBe(`Label "Histoire" removed from card ${cardId}.`);
  });

  it("says when a card did not have the label", () => {
    expect(
      formatTag(
        { cardId, label: "Histoire", tagged: false, changed: false },
        "text",
      ),
    ).toBe(`Card ${cardId} did not have the label "Histoire".`);
  });
});
