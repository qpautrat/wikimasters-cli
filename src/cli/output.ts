import type {
  Auction,
  BidAuction,
  CardSearch,
  CatalogueCard,
  CollectionCard,
  Discard,
  FavouriteChange,
  PlacedBid,
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

export function formatCollection(
  cards: readonly CollectionCard[],
  format: Format,
  requestedRarity?: string,
): string {
  if (format === "json") return JSON.stringify(cards);
  if (cards.length === 0) {
    return requestedRarity === undefined
      ? "The collection is empty."
      : `The collection holds no card of rarity ${requestedRarity}.`;
  }
  return cards
    .map(({ id, title, rarity, copies, starred, shiny, labels, obtainedAt }) =>
      [
        `${id}  ${title} (${rarity})  x${copies}  obtained ${obtainedAt}`,
        ...(starred ? ["[favourite]"] : []),
        ...(shiny ? ["[shiny]"] : []),
        ...(labels.length > 0
          ? [
              `[labels: ${labels.map((label) => JSON.stringify(label)).join(", ")}]`,
            ]
          : []),
      ].join("  "),
    )
    .join("\n");
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

function currentBidState(currentBid: number | null, leading: boolean): string {
  return currentBid === null
    ? "no bid yet"
    : `current bid ${wikibidous(currentBid)} by ${leading ? "you" : "another player"}`;
}

export function formatRunningBids(
  auctions: readonly BidAuction[],
  format: Format,
): string {
  if (format === "json") {
    return JSON.stringify(
      auctions.map(({ auctionId, ...state }) => ({ id: auctionId, ...state })),
    );
  }
  if (auctions.length === 0) return "You have no bid on a running auction.";
  return auctions
    .map(
      ({ auctionId, title, myHighestBid, currentBid, leading, endsAt }) =>
        `${auctionId}  ${title}: your bid ${wikibidous(myHighestBid)}, ${currentBidState(currentBid, leading)}, ends ${endsAt}`,
    )
    .join("\n");
}

export function formatAuction(auction: Auction, format: Format): string {
  if (format === "json") {
    const { auctionId, ...state } = auction;
    return JSON.stringify({ id: auctionId, ...state });
  }
  const {
    auctionId,
    title,
    rarity,
    shiny,
    status,
    endsAt,
    startingPrice,
    currentBid,
    leading,
    selling,
    minimumBid,
  } = auction;
  return [
    `Auction ${auctionId}: ${title} (${rarity})${shiny ? " [shiny]" : ""}`,
    `Status ${status}, ends ${endsAt}`,
    `Starting price ${wikibidous(startingPrice)}; ${currentBidState(currentBid, leading)}`,
    `Minimum bid ${wikibidous(minimumBid)}`,
    `Sold by ${selling ? "you" : "another player"}`,
  ].join("\n");
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
