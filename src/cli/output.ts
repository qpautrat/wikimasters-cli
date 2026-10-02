import type {
  CommonsDiscard,
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

export function formatDiscard(
  { discarded, gained, balance, failed }: CommonsDiscard,
  format: Format,
): string {
  if (format === "json") {
    return JSON.stringify({ discarded, gained, balance, failed });
  }
  const summary =
    discarded === 0
      ? `No common card discarded; balance ${balance} wikibidous.`
      : `Discarded ${discarded} common cards for ${gained} wikibidous; balance ${balance} wikibidous.`;
  return failed.length === 0
    ? summary
    : `${summary}\n${failed.length} cards could not be discarded: ${JSON.stringify(failed)}`;
}
