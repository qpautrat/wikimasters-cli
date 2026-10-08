import type {
  Auction,
  AuctionId,
  AuctionSearch,
  BidAuction,
  CardSearch,
  CatalogueCard,
  CollectionCard,
  Discard,
  FavouriteChange,
  LabelCreation,
  LabelDeletion,
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
    return JSON.stringify(auctions.map(withId));
  }
  if (auctions.length === 0) return "You have no bid on a running auction.";
  return auctions
    .map(
      ({ auctionId, title, myHighestBid, currentBid, leading, endsAt }) =>
        `${auctionId}  ${title}: your bid ${wikibidous(myHighestBid)}, ${currentBidState(currentBid, leading)}, ends ${endsAt}`,
    )
    .join("\n");
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

export function formatLabelCreation(
  { name, color, created }: LabelCreation,
  format: Format,
): string {
  if (format === "json") return JSON.stringify({ name, color, created });
  const label = `Label ${JSON.stringify(name)} (${color})`;
  return created ? `${label} created.` : `${label} already existed.`;
}

export function formatLabelDeletion(
  { name, deleted }: LabelDeletion,
  format: Format,
): string {
  if (format === "json") return JSON.stringify({ name, deleted });
  return deleted
    ? `Label ${JSON.stringify(name)} deleted.`
    : `You had no label named ${JSON.stringify(name)}; nothing was deleted.`;
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
