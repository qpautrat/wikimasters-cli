import type { CardId } from "./card-id.js";
import { WikiMastersError } from "./errors.js";
import { isObject } from "./object.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export interface GlobalCollectionQuery {
  text?: string | undefined;
  page?: string | undefined;
  sort?: string | undefined;
  rarities?: readonly string[] | undefined;
  wishlist?: boolean | undefined;
}

export interface FriendOwner {
  id: string;
  username: string;
  rarities: string[];
}

export interface GlobalCollectionCard {
  id: CardId;
  title: string;
  rarity: string;
  owned: boolean;
  wishlisted: boolean;
  friends: FriendOwner[];
}

export interface GlobalCollectionSearch {
  cards: GlobalCollectionCard[];
  total: number | null;
  rarityCounts: Record<string, number> | null;
  pendingOfferKeys: string[];
  hasMore: boolean;
}

interface GlobalCardRow {
  id: CardId;
  wikipedia_title: string;
  rarity: string;
}

interface GlobalCollectionResponse {
  cards: GlobalCardRow[];
  total: number | string | null;
  searchHasMore: boolean;
  rarityCounts: Record<string, number> | null;
  friendOwners: Record<string, FriendOwner[]>;
  ownedCardIds: string[];
  wishlistCardIds: string[];
  friendPendingOfferKeys: string[];
}

function isGlobalCollectionResponse(
  body: unknown,
): body is GlobalCollectionResponse {
  return (
    isObject(body) &&
    Array.isArray(body.cards) &&
    (body.total === null || ["number", "string"].includes(typeof body.total)) &&
    typeof body.searchHasMore === "boolean" &&
    (body.rarityCounts === null || isObject(body.rarityCounts)) &&
    isObject(body.friendOwners) &&
    Array.isArray(body.ownedCardIds) &&
    Array.isArray(body.wishlistCardIds) &&
    Array.isArray(body.friendPendingOfferKeys)
  );
}

function queryString({
  text,
  page,
  sort,
  rarities = [],
  wishlist = false,
}: GlobalCollectionQuery): URLSearchParams {
  const query = new URLSearchParams();
  if (page !== undefined) query.set("page", page);
  if (text !== undefined) query.set("q", text);
  for (const rarity of rarities) query.append("rarity", rarity);
  if (sort !== undefined) query.set("sort", sort);
  if (wishlist) query.set("wishlist", "1");
  return query;
}

export async function searchGlobalCollection(
  session: Session,
  query: GlobalCollectionQuery,
): Promise<GlobalCollectionSearch> {
  const action = "Searching the global collection";
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    "/global-collection",
    `/api/cards?${queryString(query)}`,
    { method: "GET" },
  );
  if (!isGlobalCollectionResponse(body)) {
    throw new WikiMastersError(
      `${action} returned an unexpected response: ${JSON.stringify(body)}`,
    );
  }
  const owned = new Set(body.ownedCardIds);
  const wishlisted = new Set(body.wishlistCardIds);
  return {
    cards: body.cards.map(({ id, wikipedia_title, rarity }) => ({
      id,
      title: wikipedia_title,
      rarity,
      owned: owned.has(id),
      wishlisted: wishlisted.has(id),
      friends: (body.friendOwners[id] ?? []).map(
        ({ id: friendId, username, rarities }) => ({
          id: friendId,
          username,
          rarities,
        }),
      ),
    })),
    total: body.total === null ? null : Number(body.total),
    rarityCounts: body.rarityCounts,
    pendingOfferKeys: body.friendPendingOfferKeys,
    hasMore: body.searchHasMore,
  };
}
