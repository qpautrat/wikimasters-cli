import { describe, expect, it } from "vitest";
import { parseAuctionId, parseCardId } from "../core/index.js";
import {
  formatAddition,
  formatAuction,
  formatAuctionSearch,
  formatAuctions,
  formatBid,
  formatCardSearch,
  formatCollection,
  formatDiscard,
  formatFavourite,
  formatLabelCreation,
  formatLabelDeletion,
  formatLogin,
  formatRemoval,
  formatRunningBids,
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
const shownAuction = {
  auctionId: bid.auctionId,
  title: "Musique celtique",
  rarity: "R",
  shiny: true,
  status: "active",
  endsAt: "2026-10-05T18:36:38.07319+00:00",
  startingPrice: 200,
  currentBid: 326,
  leading: true,
  selling: false,
};
const runningBid = {
  auctionId: bid.auctionId,
  title: "Pointe de la Sambuy",
  myHighestBid: 22,
  currentBid: 25,
  leading: false,
  endsAt: "2026-10-06T08:56:58.649051+00:00",
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
  it("lists each running auction bid on with its state in its own field", () => {
    const { auctionId, ...state } = runningBid;
    expect(JSON.parse(formatRunningBids([runningBid], "json"))).toEqual([
      { id: auctionId, ...state },
    ]);
  });

  it("lists each auction with its state in its own field", () => {
    const { auctionId, ...state } = shownAuction;
    expect(JSON.parse(formatAuctions([shownAuction], "json"))).toEqual([
      { id: auctionId, ...state },
    ]);
  });

  it("prints an empty auction list as []", () => {
    expect(formatAuctions([], "json", "active")).toBe("[]");
  });

  it("lists the found auctions with their state in their own fields, and whether more match", () => {
    const { auctionId, ...state } = shownAuction;
    expect(
      JSON.parse(
        formatAuctionSearch(
          { auctions: [shownAuction], truncated: true },
          "json",
        ),
      ),
    ).toEqual({ auctions: [{ id: auctionId, ...state }], truncated: true });
  });

  it("reports each piece of the auction state in its own field", () => {
    const { auctionId, ...state } = shownAuction;
    expect(JSON.parse(formatAuction(shownAuction, "json"))).toEqual({
      id: auctionId,
      ...state,
    });
  });

  it("reports the auction id, the amount bid and the balance", () => {
    expect(JSON.parse(formatBid(bid, "json"))).toEqual({
      id: bid.auctionId,
      amount: 359,
      balance: 7743,
    });
  });

  it("lists the found cards with their id, title and rarity, and whether the list is truncated", () => {
    expect(
      JSON.parse(
        formatCardSearch(
          {
            cards: [{ id: cardId, title: "Pointe de la Sambuy", rarity: "PC" }],
            truncated: true,
          },
          "json",
        ),
      ),
    ).toEqual({
      cards: [{ id: cardId, title: "Pointe de la Sambuy", rarity: "PC" }],
      truncated: true,
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

  it("reports a label with its name, colour and whether it was just created", () => {
    expect(
      JSON.parse(
        formatLabelCreation(
          { name: "Karmine Corp", color: "#94a3b8", created: true },
          "json",
        ),
      ),
    ).toEqual({ name: "Karmine Corp", color: "#94a3b8", created: true });
  });

  it("reports a label deletion with its name and whether it was just deleted", () => {
    expect(
      JSON.parse(
        formatLabelDeletion({ name: "Karmine Corp", deleted: true }, "json"),
      ),
    ).toEqual({ name: "Karmine Corp", deleted: true });
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
  it("prints one line per auction with its card, state, and the user's part in it", () => {
    expect(
      formatAuctions(
        [
          shownAuction,
          {
            ...shownAuction,
            shiny: false,
            currentBid: null,
            leading: false,
            selling: true,
          },
        ],
        "text",
      ).split("\n"),
    ).toEqual([
      "d6669009-683d-44b6-b6e7-2c0960c37f2f  Musique celtique (R) [shiny]: active, ends 2026-10-05T18:36:38.07319+00:00, starting price 200 wikibidous, current bid 326 wikibidous by you, sold by another player",
      "d6669009-683d-44b6-b6e7-2c0960c37f2f  Musique celtique (R): active, ends 2026-10-05T18:36:38.07319+00:00, starting price 200 wikibidous, no bid yet, sold by you",
    ]);
  });

  it("says when there is no auction to list", () => {
    expect(formatAuctions([], "text")).toBe("No auction to list.");
    expect(formatAuctions([], "text", "cancelled")).toBe(
      "No auction with status cancelled.",
    );
  });

  it("prints one line per running auction bid on", () => {
    expect(formatRunningBids([runningBid], "text")).toBe(
      `${bid.auctionId}  Pointe de la Sambuy: your bid 22 wikibidous, current bid 25 wikibidous by another player, ends 2026-10-06T08:56:58.649051+00:00`,
    );
  });

  it("says when the user has no bid on a running auction", () => {
    expect(formatRunningBids([], "text")).toBe(
      "You have no bid on a running auction.",
    );
  });

  it("prints the auction state", () => {
    expect(formatAuction(shownAuction, "text").split("\n")).toEqual([
      `Auction ${bid.auctionId}: Musique celtique (R) [shiny]`,
      "Status active, ends 2026-10-05T18:36:38.07319+00:00",
      "Starting price 200 wikibidous; current bid 326 wikibidous by you",
      "Sold by another player",
    ]);
  });

  it("says when nobody has bid on the auction", () => {
    expect(
      formatAuction(
        { ...shownAuction, currentBid: null, leading: false, selling: true },
        "text",
      ).split("\n"),
    ).toContain("Starting price 200 wikibidous; no bid yet");
  });

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

  it("prints a found auction as a listed one", () => {
    expect(
      formatAuctionSearch(
        { auctions: [shownAuction], truncated: false },
        "text",
      ),
    ).toBe(formatAuctions([shownAuction], "text"));
  });

  it("says when more auctions match beyond the page shown", () => {
    expect(
      formatAuctionSearch(
        { auctions: [shownAuction], truncated: true },
        "text",
      ).split("\n"),
    ).toEqual([
      formatAuctions([shownAuction], "text"),
      "More auctions match beyond this page.",
    ]);
  });

  it("says when no auction matches", () => {
    expect(
      formatAuctionSearch({ auctions: [], truncated: false }, "text"),
    ).toBe("No auction matches.");
  });

  it("prints one line per found card", () => {
    expect(
      formatCardSearch(
        {
          cards: [{ id: cardId, title: "Pointe de la Sambuy", rarity: "PC" }],
          truncated: false,
        },
        "text",
      ),
    ).toBe(`${cardId}  Pointe de la Sambuy (PC)`);
  });

  it("says when more cards match than are shown", () => {
    expect(
      formatCardSearch(
        {
          cards: [{ id: cardId, title: "Pointe de la Sambuy", rarity: "PC" }],
          truncated: true,
        },
        "text",
      ).split("\n"),
    ).toEqual([
      `${cardId}  Pointe de la Sambuy (PC)`,
      "Only the first 1 matches are shown; refine the name.",
    ]);
  });

  it("says when no card matches", () => {
    expect(formatCardSearch({ cards: [], truncated: false }, "text")).toBe(
      "No card of the catalogue matches.",
    );
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

  it("says when a label is created, with its colour", () => {
    expect(
      formatLabelCreation(
        { name: "Karmine Corp", color: "#facc15", created: true },
        "text",
      ),
    ).toBe('Label "Karmine Corp" (#facc15) created.');
  });

  it("says when a label already existed, with its colour", () => {
    expect(
      formatLabelCreation(
        { name: "Karmine Corp", color: "#94a3b8", created: false },
        "text",
      ),
    ).toBe('Label "Karmine Corp" (#94a3b8) already existed.');
  });

  it("says when a label is deleted", () => {
    expect(
      formatLabelDeletion({ name: "Karmine Corp", deleted: true }, "text"),
    ).toBe('Label "Karmine Corp" deleted.');
  });

  it("says when there was no label of that name", () => {
    expect(
      formatLabelDeletion({ name: "Karmine Corp", deleted: false }, "text"),
    ).toBe('You had no label named "Karmine Corp"; nothing was deleted.');
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
