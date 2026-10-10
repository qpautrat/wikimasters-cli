import { describe, expect, it } from "vitest";
import {
  asEntryId,
  asLabelId,
  parseAuctionId,
  parseCardId,
} from "../core/index.js";
import {
  formatAddition,
  formatAuction,
  formatAuctionSearch,
  formatAuctions,
  formatBid,
  formatCancelledAuction,
  formatCardSearch,
  formatCardValues,
  formatCollection,
  formatCreatedAuction,
  formatDiscard,
  formatEntryFavourite,
  formatEntryTag,
  formatEntryUntag,
  formatGlobalCollection,
  formatLabelCreation,
  formatLabelDeletion,
  formatLabels,
  formatLogin,
  formatProfileCollection,
  formatRemoval,
  formatRunningBids,
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
const label = {
  id: asLabelId("a3e91d47-2f6b-4c8a-b5d0-7e1c9f3a2b64"),
  name: "KC LOL 2026",
  color: "#1e40af",
};
const createdAuction = {
  auctionId: parseAuctionId("0f3a7c21-5b8e-4d96-a1c4-7e2b9d5f8a63"),
};
const cancelledAuction = {
  auctionId: parseAuctionId("0f3a7c21-5b8e-4d96-a1c4-7e2b9d5f8a63"),
  status: "cancelled",
};
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
  amount: 22,
  placedAt: "2026-10-05T18:00:00.123456+00:00",
  currentBid: 25,
  leading: false,
  endsAt: "2026-10-06T08:56:58.649051+00:00",
};
const entryId = asEntryId("3d2a29bf-b8a9-4519-924a-67f0daacc644");
const owned = {
  entryId,
  id: cardId,
  title: "Pointe de la Sambuy",
  rarity: "C",
  copies: 1,
  starred: false,
  shiny: false,
  labels: [],
  obtainedAt: "2026-09-18T23:42:15.692426+00:00",
};
const soldCard = {
  id: cardId,
  title: "Pointe de la Sambuy",
  averages: { R: 19, PC: 56 },
};
const unsoldCard = { id: cardId, title: "Pointe de la Sambuy", averages: {} };

const friendId = "37fe4f31-003f-40c1-9eb6-1f39e0947037";
const globalCard = {
  id: cardId,
  title: "Pointe de la Sambuy",
  rarity: "PC",
  owned: true,
  wishlisted: true,
  friends: [
    { id: friendId, username: "LucasPerso", rarities: ["R"] },
    {
      id: "de78c800-d3b9-4942-a26d-e7942441aa72",
      username: "Marie",
      rarities: ["C", "SR"],
    },
  ],
};
const globalSearch = {
  cards: [globalCard],
  total: 6,
  rarityCounts: { PC: 5, UR: 1 },
  pendingOfferKeys: [`${friendId}:${cardId}`],
  hasMore: true,
};
const emptyGlobalSearch = {
  cards: [],
  total: null,
  rarityCounts: null,
  pendingOfferKeys: [],
  hasMore: false,
};

const playerEntry = {
  entryId,
  id: cardId,
  title: "Pointe de la Sambuy",
  rarity: "SR",
  count: 1,
  starred: false,
  shiny: false,
  labels: [],
  pendingTrade: false,
};
const discard = { discarded: 3, gained: 3, balance: 7430, failed: [] };

describe("JSON output", () => {
  it("lists each bid on a running auction with its state in its own field, and whether the page is full", () => {
    const { auctionId, ...state } = runningBid;
    expect(
      JSON.parse(formatRunningBids({ bids: [runningBid], full: true }, "json")),
    ).toEqual({ bids: [{ id: auctionId, ...state }], full: true });
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

  it("reports each card found in the global collection with the friends who own it, and the page's totals", () => {
    expect(JSON.parse(formatGlobalCollection(globalSearch, "json"))).toEqual({
      cards: [
        {
          id: cardId,
          title: "Pointe de la Sambuy",
          rarity: "PC",
          owned: true,
          wishlisted: true,
          friends: globalCard.friends,
        },
      ],
      total: 6,
      rarityCounts: { PC: 5, UR: 1 },
      pendingOfferKeys: [`${friendId}:${cardId}`],
      hasMore: true,
    });
  });

  it("reports a global collection search without result with empty fields", () => {
    expect(
      JSON.parse(formatGlobalCollection(emptyGlobalSearch, "json")),
    ).toEqual({
      cards: [],
      total: null,
      rarityCounts: null,
      pendingOfferKeys: [],
      hasMore: false,
    });
  });

  it("reports each piece of the auction state in its own field", () => {
    const { auctionId, ...state } = shownAuction;
    expect(JSON.parse(formatAuction(shownAuction, "json"))).toEqual({
      id: auctionId,
      ...state,
    });
  });

  it("reports the created auction's id as auctionId", () => {
    expect(JSON.parse(formatCreatedAuction(createdAuction, "json"))).toEqual({
      auctionId: createdAuction.auctionId,
    });
  });

  it("reports the cancelled auction's id and the status the game gives", () => {
    expect(
      JSON.parse(formatCancelledAuction(cancelledAuction, "json")),
    ).toEqual({ auctionId: cancelledAuction.auctionId, status: "cancelled" });
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

  it("lists each card with its id, title and average sale price per rarity, empty when never sold", () => {
    expect(
      JSON.parse(formatCardValues([soldCard, unsoldCard], "json")),
    ).toEqual([
      { id: cardId, title: "Pointe de la Sambuy", averages: { R: 19, PC: 56 } },
      { id: cardId, title: "Pointe de la Sambuy", averages: {} },
    ]);
  });

  it("lists the wishlist as an array of id, title, rarity and ownership", () => {
    expect(JSON.parse(formatWishlist(cards, "json"))).toEqual([
      { id: cardId, title: "Pointe de la Sambuy", rarity: "PC", owned: false },
    ]);
  });

  it("reports a collection page as its cards, each attribute in its own field, and whether it is full", () => {
    expect(
      JSON.parse(formatCollection({ cards: [owned], full: true }, "json")),
    ).toEqual({
      cards: [
        {
          entryId,
          id: cardId,
          title: "Pointe de la Sambuy",
          rarity: "C",
          copies: 1,
          starred: false,
          shiny: false,
          labels: [],
          obtainedAt: "2026-09-18T23:42:15.692426+00:00",
        },
      ],
      full: true,
    });
  });

  it("reports a player's collection page as its entries and whether it is full", () => {
    expect(
      JSON.parse(
        formatProfileCollection(
          { entries: [playerEntry], full: false },
          "json",
        ),
      ),
    ).toEqual({
      entries: [
        {
          entryId,
          id: cardId,
          title: "Pointe de la Sambuy",
          rarity: "SR",
          count: 1,
          starred: false,
          shiny: false,
          labels: [],
          pendingTrade: false,
        },
      ],
      full: false,
    });
  });

  it("gives no entry for an empty page of a player's collection", () => {
    expect(
      JSON.parse(formatProfileCollection({ entries: [], full: false }, "json")),
    ).toEqual({ entries: [], full: false });
  });

  it("gives an empty array of cards for an empty collection page", () => {
    expect(
      JSON.parse(formatCollection({ cards: [], full: false }, "json", "UR")),
    ).toEqual({ cards: [], full: false });
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

  it("reports a favourite entry with its id and state", () => {
    expect(
      JSON.parse(formatEntryFavourite({ entryId, starred: true }, "json")),
    ).toEqual({ entryId, starred: true });
  });

  it("reports a labelled entry with its id and the label id", () => {
    expect(
      JSON.parse(formatEntryTag({ entryId, labelId: label.id }, "json")),
    ).toEqual({ entryId, labelId: label.id });
  });

  it("reports a label removal with the entry id, the label id and whether it was removed", () => {
    expect(
      JSON.parse(
        formatEntryUntag(
          { entryId, labelId: label.id, removed: false },
          "json",
        ),
      ),
    ).toEqual({ entryId, labelId: label.id, removed: false });
  });

  it("lists the labels as an array of id, name and colour", () => {
    expect(JSON.parse(formatLabels([label], "json"))).toEqual([
      {
        id: "a3e91d47-2f6b-4c8a-b5d0-7e1c9f3a2b64",
        name: "KC LOL 2026",
        color: "#1e40af",
      },
    ]);
  });

  it("gives an empty array when the user has no label", () => {
    expect(formatLabels([], "json")).toBe("[]");
  });

  it("reports a created label with its id, name and colour", () => {
    const label = {
      id: asLabelId("5c0f8e2a-7b1d-4e3f-9a6c-2d8b4f1e7a35"),
      name: "Karmine Corp",
      color: "#94a3b8",
    };
    expect(JSON.parse(formatLabelCreation(label, "json"))).toEqual(label);
  });

  it("reports a label deletion with the deleted label's id", () => {
    expect(
      JSON.parse(
        formatLabelDeletion(
          { id: asLabelId("5c0f8e2a-7b1d-4e3f-9a6c-2d8b4f1e7a35") },
          "json",
        ),
      ),
    ).toEqual({ id: "5c0f8e2a-7b1d-4e3f-9a6c-2d8b4f1e7a35" });
  });

  it("reports a discard with its count, gain, balance and refused entries", () => {
    const failed = [{ entryId, reason: "card_not_owned" }];
    expect(JSON.parse(formatDiscard({ ...discard, failed }, "json"))).toEqual({
      ...discard,
      failed,
    });
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

  it("prints one line per card of the global collection, then the totals the game gives", () => {
    expect(formatGlobalCollection(globalSearch, "text").split("\n")).toEqual([
      `${cardId}  Pointe de la Sambuy (PC)  [owned]  [wishlisted]  [friends: ${friendId} LucasPerso (R); de78c800-d3b9-4942-a26d-e7942441aa72 Marie (C, SR)]`,
      "Total: 6 cards.",
      "By rarity: PC 5, UR 1.",
      `Pending offers (player id:card id): ${friendId}:${cardId}.`,
      "More cards match beyond this page.",
    ]);
  });

  it("prints a card of the global collection that nobody holds without marks", () => {
    expect(
      formatGlobalCollection(
        {
          ...emptyGlobalSearch,
          cards: [
            { ...globalCard, owned: false, wishlisted: false, friends: [] },
          ],
        },
        "text",
      ),
    ).toBe(`${cardId}  Pointe de la Sambuy (PC)`);
  });

  it("says when no card of the global collection matches", () => {
    expect(formatGlobalCollection(emptyGlobalSearch, "text")).toBe(
      "No card of the global collection matches.",
    );
  });

  it("says when there is no auction to list", () => {
    expect(formatAuctions([], "text")).toBe("No auction to list.");
    expect(formatAuctions([], "text", "cancelled")).toBe(
      "No auction with status cancelled.",
    );
  });

  it("prints one line per bid on a running auction", () => {
    expect(formatRunningBids({ bids: [runningBid], full: false }, "text")).toBe(
      `${bid.auctionId}  Pointe de la Sambuy: your bid 22 wikibidous placed 2026-10-05T18:00:00.123456+00:00, current bid 25 wikibidous by another player, ends 2026-10-06T08:56:58.649051+00:00`,
    );
  });

  it("says when the page of bids is full", () => {
    expect(
      formatRunningBids({ bids: [runningBid], full: true }, "text").split(
        "\n",
      )[1],
    ).toBe("The page is full (1 bid); more may follow.");
  });

  it("says when the page of bids is empty", () => {
    expect(formatRunningBids({ bids: [], full: false }, "text")).toBe(
      "This page of your bids on running auctions is empty.",
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

  it("prints the created auction's id", () => {
    expect(formatCreatedAuction(createdAuction, "text")).toBe(
      `Auction ${createdAuction.auctionId} created.`,
    );
  });

  it("prints the cancelled auction's id and the status the game gives", () => {
    expect(formatCancelledAuction(cancelledAuction, "text")).toBe(
      `Auction ${cancelledAuction.auctionId} cancelled.`,
    );
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

  it("names each entry the game refused to discard with its reason", () => {
    expect(
      formatDiscard(
        {
          ...discard,
          failed: [{ entryId, reason: "card_not_owned" }],
        },
        "text",
      ).split("\n"),
    ).toEqual([
      "Discarded 3 cards for 3 wikibidous; balance 7430 wikibidous.",
      `Entry ${entryId} could not be discarded: card_not_owned`,
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

  it("prints one line per card with its average sale price per rarity, in the game's order", () => {
    expect(formatCardValues([soldCard], "text")).toBe(
      `${cardId}  Pointe de la Sambuy: average sale price R 19 wikibidous, PC 56 wikibidous`,
    );
  });

  it("says when a card was never sold", () => {
    expect(formatCardValues([unsoldCard], "text")).toBe(
      `${cardId}  Pointe de la Sambuy: never sold`,
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

  it("prints one line per collection card, entry id first", () => {
    expect(formatCollection({ cards: [owned], full: false }, "text")).toBe(
      `${entryId}  ${cardId}  Pointe de la Sambuy (C)  x1  obtained 2026-09-18T23:42:15.692426+00:00`,
    );
  });

  it("marks the favourite, shiny and labelled collection cards", () => {
    expect(
      formatCollection(
        {
          cards: [
            {
              ...owned,
              copies: 2,
              starred: true,
              shiny: true,
              labels: ["Lieux", "Montagnes"],
            },
          ],
          full: false,
        },
        "text",
      ),
    ).toBe(
      `${entryId}  ${cardId}  Pointe de la Sambuy (C)  x2  obtained 2026-09-18T23:42:15.692426+00:00  [favourite]  [shiny]  [labels: "Lieux", "Montagnes"]`,
    );
  });

  it("prints one line per entry of a player's collection, entry id first", () => {
    expect(
      formatProfileCollection({ entries: [playerEntry], full: false }, "text"),
    ).toBe(`${entryId}  ${cardId}  Pointe de la Sambuy (SR)  x1`);
  });

  it("marks the favourite, shiny, labelled and pending trade entries of a player's collection", () => {
    expect(
      formatProfileCollection(
        {
          entries: [
            {
              ...playerEntry,
              count: 2,
              starred: true,
              shiny: true,
              labels: ["Métro"],
              pendingTrade: true,
            },
          ],
          full: false,
        },
        "text",
      ),
    ).toBe(
      `${entryId}  ${cardId}  Pointe de la Sambuy (SR)  x2  [favourite]  [shiny]  [labels: "Métro"]  [pending trade]`,
    );
  });

  it("says when a page of a player's collection is full", () => {
    const entries = Array.from({ length: 50 }, () => playerEntry);
    expect(
      formatProfileCollection({ entries, full: true }, "text")
        .split("\n")
        .at(-1),
    ).toBe("The page is full (50 entries); more may follow.");
  });

  it("says when a page of a player's collection is empty", () => {
    expect(formatProfileCollection({ entries: [], full: false }, "text")).toBe(
      "This page of the collection is empty.",
    );
  });

  it("says when a full collection page may be followed by others", () => {
    expect(formatCollection({ cards: [owned], full: true }, "text")).toBe(
      [
        `${entryId}  ${cardId}  Pointe de la Sambuy (C)  x1  obtained 2026-09-18T23:42:15.692426+00:00`,
        "The page is full (1 card); more may follow.",
      ].join("\n"),
    );
  });

  it("says when the collection page is empty", () => {
    expect(formatCollection({ cards: [], full: false }, "text")).toBe(
      "This page of the collection is empty.",
    );
  });

  it("says when the collection page holds no card of the requested rarity", () => {
    expect(formatCollection({ cards: [], full: false }, "text", "UR")).toBe(
      "This page of the collection holds no card of rarity UR.",
    );
  });

  it("prints one line per label with its id, name and colour", () => {
    expect(formatLabels([label], "text")).toBe(
      'a3e91d47-2f6b-4c8a-b5d0-7e1c9f3a2b64  "KC LOL 2026" (#1e40af)',
    );
  });

  it("says when the user has no label", () => {
    expect(formatLabels([], "text")).toBe("You have no label.");
  });

  it("says when the wishlist is empty", () => {
    expect(formatWishlist([], "text")).toBe("The wishlist is empty.");
  });

  it("says when an entry is marked as favourite", () => {
    expect(formatEntryFavourite({ entryId, starred: true }, "text")).toBe(
      `Entry ${entryId} marked as favourite.`,
    );
  });

  it("says when an entry is removed from the favourites", () => {
    expect(formatEntryFavourite({ entryId, starred: false }, "text")).toBe(
      `Entry ${entryId} removed from the favourites.`,
    );
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

  it("says when a label is created, with its colour and id", () => {
    expect(
      formatLabelCreation(
        {
          id: asLabelId("5c0f8e2a-7b1d-4e3f-9a6c-2d8b4f1e7a35"),
          name: "Karmine Corp",
          color: "#facc15",
        },
        "text",
      ),
    ).toBe(
      'Label "Karmine Corp" (#facc15) created with id 5c0f8e2a-7b1d-4e3f-9a6c-2d8b4f1e7a35.',
    );
  });

  it("says when a label is deleted", () => {
    expect(
      formatLabelDeletion(
        { id: asLabelId("5c0f8e2a-7b1d-4e3f-9a6c-2d8b4f1e7a35") },
        "text",
      ),
    ).toBe("Label 5c0f8e2a-7b1d-4e3f-9a6c-2d8b4f1e7a35 deleted.");
  });

  it("says when an entry is labelled", () => {
    expect(formatEntryTag({ entryId, labelId: label.id }, "text")).toBe(
      `Entry ${entryId} labelled with label ${label.id}.`,
    );
  });

  it("says when a label is removed from an entry", () => {
    expect(
      formatEntryUntag({ entryId, labelId: label.id, removed: true }, "text"),
    ).toBe(`Label ${label.id} removed from entry ${entryId}.`);
  });

  it("says when an entry did not have the label", () => {
    expect(
      formatEntryUntag({ entryId, labelId: label.id, removed: false }, "text"),
    ).toBe(`Entry ${entryId} did not have the label ${label.id}.`);
  });
});
