import type {
  CommonsDiscard,
  FavouriteChange,
  PlacedBid,
  WishlistCard,
  WishlistRemoval,
} from "../core/index.js";

export type Format = "text" | "json";

export function formatLogin(userId: string, format: Format): string {
  return format === "json"
    ? JSON.stringify({ userId })
    : `Logged in as user ${userId}.`;
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
    .map(
      ({ id, title, rarity, owned }) =>
        `${id}  ${title} (${rarity})${owned ? "  [owned]" : ""}`,
    )
    .join("\n");
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

function cards(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function wikibidous(count: number): string {
  return `${count} wikibidou${count === 1 ? "" : "s"}`;
}

export function formatDiscard(
  { discarded, gained, balance, failed }: CommonsDiscard,
  format: Format,
): string {
  if (format === "json") {
    return JSON.stringify({ discarded, gained, balance, failed });
  }
  const summary =
    discarded === 0
      ? `No common card discarded; balance ${wikibidous(balance)}.`
      : `Discarded ${cards(discarded, "common card")} for ${wikibidous(gained)}; balance ${wikibidous(balance)}.`;
  return failed.length === 0
    ? summary
    : `${summary}\n${cards(failed.length, "card")} could not be discarded: ${JSON.stringify(failed)}`;
}

export function formatBid(
  { auctionId, amount, balance }: PlacedBid,
  format: Format,
): string {
  if (format === "json")
    return JSON.stringify({ id: auctionId, amount, balance });
  return `Bid ${wikibidous(amount)} on auction ${auctionId}; balance ${wikibidous(balance)}.`;
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
