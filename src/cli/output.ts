import type {
  Auction,
  AuctionId,
  AuctionSearch,
  CancelledAuction,
  CardSearch,
  CardValue,
  CatalogueCard,
  CollectionPage,
  CreatedAuction,
  Discard,
  EntryFavourite,
  FavouriteChange,
  FriendOwner,
  GlobalCollectionCard,
  GlobalCollectionSearch,
  Label,
  LabelDeletion,
  PlacedBid,
  ProfileCollectionPage,
  RunningBidPage,
  TagChange,
  WishlistAddition,
  WishlistCard,
  WishlistRemoval,
} from "../core/index.js";

export type Format = "text" | "json";

export function formatLogin(userId: string, format: Format): string {
  return format === "json"
    ? JSON.stringify({ userId })
    : `Logged in as user ${userId}.`;
}

function cardLine({ id, title, rarity }: CatalogueCard): string {
  return `${id}  ${title} (${rarity})`;
}

export function formatWishlist(
  cards: readonly WishlistCard[],
  format: Format,
): string {
  if (format === "json") {
    return JSON.stringify(
      cards.map(({ id, title, rarity, owned }) => ({
        id,
        title,
        rarity,
        owned,
      })),
    );
  }
  if (cards.length === 0) return "The wishlist is empty.";
  return cards
    .map((card) => `${cardLine(card)}${card.owned ? "  [owned]" : ""}`)
    .join("\n");
}

export function formatAddition(
  { cardId, title, added }: WishlistAddition,
  format: Format,
): string {
  if (format === "json") return JSON.stringify({ id: cardId, title, added });
  return added
    ? `Card ${cardId} (${title}) added to the wishlist.`
    : `Card ${cardId} (${title}) was already in the wishlist.`;
}

export function formatRemoval(
  { cardId, removed }: WishlistRemoval,
  format: Format,
): string {
  if (format === "json") return JSON.stringify({ id: cardId, removed });
  return removed
    ? `Card ${cardId} removed from the wishlist.`
    : `Card ${cardId} was not in the wishlist.`;
}

export function formatCardSearch(
  { cards, truncated }: CardSearch,
  format: Format,
): string {
  if (format === "json") return JSON.stringify({ cards, truncated });
  if (cards.length === 0) return "No card of the catalogue matches.";
  return [
    ...cards.map(cardLine),
    ...(truncated
      ? [`Only the first ${cards.length} matches are shown; refine the name.`]
      : []),
  ].join("\n");
}

export function formatCardValues(
  values: readonly CardValue[],
  format: Format,
): string {
  if (format === "json") return JSON.stringify(values);
  return values
    .map(({ id, title, averages }) => {
      const prices = Object.entries(averages).map(
        ([rarity, average]) => `${rarity} ${wikibidous(average)}`,
      );
      return `${id}  ${title}: ${
        prices.length === 0
          ? "never sold"
          : `average sale price ${prices.join(", ")}`
      }`;
    })
    .join("\n");
}

function friendOwner({ id, username, rarities }: FriendOwner): string {
  return `${id} ${username} (${rarities.join(", ")})`;
}

function globalCardLine(card: GlobalCollectionCard): string {
  return [
    cardLine(card),
    ...(card.owned ? ["[owned]"] : []),
    ...(card.wishlisted ? ["[wishlisted]"] : []),
    ...(card.friends.length > 0
      ? [`[friends: ${card.friends.map(friendOwner).join("; ")}]`]
      : []),
  ].join("  ");
}

export function formatGlobalCollection(
  search: GlobalCollectionSearch,
  format: Format,
): string {
  if (format === "json") return JSON.stringify(search);
  const {
    cards: found,
    total,
    rarityCounts,
    pendingOfferKeys,
    hasMore,
  } = search;
  const counts = Object.entries(rarityCounts ?? {});
  return [
    ...(found.length === 0
      ? ["No card of the global collection matches."]
      : found.map(globalCardLine)),
    ...(total === null ? [] : [`Total: ${cards(total, "card")}.`]),
    ...(counts.length > 0
      ? [
          `By rarity: ${counts.map(([rarity, count]) => `${rarity} ${count}`).join(", ")}.`,
        ]
      : []),
    ...(pendingOfferKeys.length > 0
      ? [`Pending offers (player id:card id): ${pendingOfferKeys.join(", ")}.`]
      : []),
    ...(hasMore ? ["More cards match beyond this page."] : []),
  ].join("\n");
}

function collectionMarks({
  starred,
  shiny,
  labels,
}: {
  starred: boolean;
  shiny: boolean;
  labels: readonly string[];
}): string[] {
  return [
    ...(starred ? ["[favourite]"] : []),
    ...(shiny ? ["[shiny]"] : []),
    ...(labels.length > 0
      ? [`[labels: ${labels.map((label) => JSON.stringify(label)).join(", ")}]`]
      : []),
  ];
}

export function formatCollection(
  page: CollectionPage,
  format: Format,
  requestedRarity?: string,
): string {
  if (format === "json") return JSON.stringify(page);
  const { cards: pageCards, full } = page;
  if (pageCards.length === 0) {
    return requestedRarity === undefined
      ? "This page of the collection is empty."
      : `This page of the collection holds no card of rarity ${requestedRarity}.`;
  }
  return [
    ...pageCards.map(
      ({
        entryId,
        id,
        title,
        rarity,
        copies,
        starred,
        shiny,
        labels,
        obtainedAt,
      }) =>
        [
          `${entryId}  ${id}  ${title} (${rarity})  x${copies}  obtained ${obtainedAt}`,
          ...collectionMarks({ starred, shiny, labels }),
        ].join("  "),
    ),
    ...(full
      ? [
          `The page is full (${cards(pageCards.length, "card")}); more may follow.`,
        ]
      : []),
  ].join("\n");
}

export function formatProfileCollection(
  page: ProfileCollectionPage,
  format: Format,
): string {
  if (format === "json") return JSON.stringify(page);
  const { entries, full } = page;
  if (entries.length === 0) return "This page of the collection is empty.";
  return [
    ...entries.map(
      ({
        entryId,
        id,
        title,
        rarity,
        count,
        starred,
        shiny,
        labels,
        pendingTrade,
      }) =>
        [
          `${entryId}  ${id}  ${title} (${rarity})  x${count}`,
          ...collectionMarks({ starred, shiny, labels }),
          ...(pendingTrade ? ["[pending trade]"] : []),
        ].join("  "),
    ),
    ...(full
      ? [`The page is full (${entries.length} entries); more may follow.`]
      : []),
  ].join("\n");
}

function cards(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function wikibidous(count: number): string {
  return `${count} wikibidou${count === 1 ? "" : "s"}`;
}

export function formatDiscard(
  { discarded, gained, balance, failed }: Discard,
  format: Format,
): string {
  if (format === "json") {
    return JSON.stringify({
      discarded,
      gained,
      balance,
      failed: failed.map(({ cardId, reason }) => ({ id: cardId, reason })),
    });
  }
  const summary =
    discarded === 0
      ? `No card discarded; balance ${wikibidous(balance)}.`
      : `Discarded ${cards(discarded, "card")} for ${wikibidous(gained)}; balance ${wikibidous(balance)}.`;
  return [
    summary,
    ...failed.map(
      ({ cardId, reason }) =>
        `Card ${cardId} could not be discarded: ${reason}`,
    ),
  ].join("\n");
}

export function formatBid(
  { auctionId, amount, balance }: PlacedBid,
  format: Format,
): string {
  if (format === "json")
    return JSON.stringify({ id: auctionId, amount, balance });
  return `Bid ${wikibidous(amount)} on auction ${auctionId}; balance ${wikibidous(balance)}.`;
}

export function formatCreatedAuction(
  { auctionId }: CreatedAuction,
  format: Format,
): string {
  if (format === "json") return JSON.stringify({ auctionId });
  return `Auction ${auctionId} created.`;
}

export function formatCancelledAuction(
  { auctionId, status }: CancelledAuction,
  format: Format,
): string {
  if (format === "json") return JSON.stringify({ auctionId, status });
  return `Auction ${auctionId} ${status}.`;
}

function currentBidState(currentBid: number | null, leading: boolean): string {
  return currentBid === null
    ? "no bid yet"
    : `current bid ${wikibidous(currentBid)} by ${leading ? "you" : "another player"}`;
}

export function formatRunningBids(
  { bids, full }: RunningBidPage,
  format: Format,
): string {
  if (format === "json") {
    return JSON.stringify({ bids: bids.map(withId), full });
  }
  if (bids.length === 0) {
    return "This page of your bids on running auctions is empty.";
  }
  return [
    ...bids.map(
      ({ auctionId, title, amount, placedAt, currentBid, leading, endsAt }) =>
        `${auctionId}  ${title}: your bid ${wikibidous(amount)} placed ${placedAt}, ${currentBidState(currentBid, leading)}, ends ${endsAt}`,
    ),
    ...(full
      ? [`The page is full (${cards(bids.length, "bid")}); more may follow.`]
      : []),
  ].join("\n");
}

function withId<T extends { auctionId: AuctionId }>({
  auctionId,
  ...state
}: T) {
  return { id: auctionId, ...state };
}

function auctionedCopy({ title, rarity, shiny }: Auction): string {
  return `${title} (${rarity})${shiny ? " [shiny]" : ""}`;
}

function seller(selling: boolean): string {
  return selling ? "you" : "another player";
}

export function formatAuctions(
  auctions: readonly Auction[],
  format: Format,
  requestedStatus?: string,
): string {
  if (format === "json") return JSON.stringify(auctions.map(withId));
  if (auctions.length === 0) {
    return requestedStatus === undefined
      ? "No auction to list."
      : `No auction with status ${requestedStatus}.`;
  }
  return auctions.map(auctionLine).join("\n");
}

function auctionLine(auction: Auction): string {
  return `${auction.auctionId}  ${auctionedCopy(auction)}: ${auction.status}, ends ${auction.endsAt}, starting price ${wikibidous(auction.startingPrice)}, ${currentBidState(auction.currentBid, auction.leading)}, sold by ${seller(auction.selling)}`;
}

export function formatAuctionSearch(
  { auctions, truncated }: AuctionSearch,
  format: Format,
): string {
  if (format === "json") {
    return JSON.stringify({ auctions: auctions.map(withId), truncated });
  }
  if (auctions.length === 0) return "No auction matches.";
  return [
    ...auctions.map(auctionLine),
    ...(truncated ? ["More auctions match beyond this page."] : []),
  ].join("\n");
}

export function formatAuction(auction: Auction, format: Format): string {
  if (format === "json") return JSON.stringify(withId(auction));
  const { auctionId, status, endsAt, startingPrice, currentBid, leading } =
    auction;
  return [
    `Auction ${auctionId}: ${auctionedCopy(auction)}`,
    `Status ${status}, ends ${endsAt}`,
    `Starting price ${wikibidous(startingPrice)}; ${currentBidState(currentBid, leading)}`,
    `Sold by ${seller(auction.selling)}`,
  ].join("\n");
}

export function formatEntryFavourite(
  { entryId, starred }: EntryFavourite,
  format: Format,
): string {
  if (format === "json") return JSON.stringify({ entryId, starred });
  return starred
    ? `Entry ${entryId} marked as favourite.`
    : `Entry ${entryId} removed from the favourites.`;
}

export function formatFavourite(
  { cardId, starred, changed }: FavouriteChange,
  format: Format,
): string {
  if (format === "json")
    return JSON.stringify({ id: cardId, starred, changed });
  if (starred) {
    return changed
      ? `Card ${cardId} marked as favourite.`
      : `Card ${cardId} was already a favourite.`;
  }
  return changed
    ? `Card ${cardId} removed from the favourites.`
    : `Card ${cardId} was not a favourite.`;
}

export function formatLabels(labels: readonly Label[], format: Format): string {
  if (format === "json") {
    return JSON.stringify(
      labels.map(({ id, name, color }) => ({ id, name, color })),
    );
  }
  if (labels.length === 0) return "You have no label.";
  return labels
    .map(({ id, name, color }) => `${id}  ${JSON.stringify(name)} (${color})`)
    .join("\n");
}

export function formatLabelCreation(
  { id, name, color }: Label,
  format: Format,
): string {
  if (format === "json") return JSON.stringify({ id, name, color });
  return `Label ${JSON.stringify(name)} (${color}) created with id ${id}.`;
}

export function formatLabelDeletion(
  { id }: LabelDeletion,
  format: Format,
): string {
  if (format === "json") return JSON.stringify({ id });
  return `Label ${id} deleted.`;
}

export function formatTag(
  { cardId, label, tagged, changed }: TagChange,
  format: Format,
): string {
  if (format === "json")
    return JSON.stringify({ id: cardId, label, tagged, changed });
  const name = JSON.stringify(label);
  if (tagged) {
    return changed
      ? `Card ${cardId} labelled ${name}.`
      : `Card ${cardId} already had the label ${name}.`;
  }
  return changed
    ? `Label ${name} removed from card ${cardId}.`
    : `Card ${cardId} did not have the label ${name}.`;
}
