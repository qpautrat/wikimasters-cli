import type { CardId } from "./card-id.js";
import { WikiMastersError } from "./errors.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export const PROFILE_COLLECTION_PAGE_SIZE = 50;

export interface ProfileCollectionQuery {
  page: string;
  sort?: string;
  search?: string;
  rarities?: readonly string[];
  wishlisted?: boolean;
}

export interface ProfileCollectionEntry {
  entryId: string;
  id: CardId;
  title: string;
  rarity: string;
  count: number;
  starred: boolean;
  shiny: boolean;
  labels: string[];
  pendingTrade: boolean;
}

export interface ProfileCollectionPage {
  entries: ProfileCollectionEntry[];
  full: boolean;
}

interface ProfileCollectionRow {
  id: string;
  card: { id: CardId; wikipedia_title: string; rarity: string };
  count: number;
  starred: boolean;
  is_shiny: boolean;
  tags: { name: string }[];
}

interface ProfileCollectionResponse {
  collection: ProfileCollectionRow[];
  pendingTradeCardIds: CardId[];
}

function isProfileCollectionResponse(
  body: unknown,
): body is ProfileCollectionResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "collection" in body &&
    Array.isArray(body.collection) &&
    "pendingTradeCardIds" in body &&
    Array.isArray(body.pendingTradeCardIds)
  );
}

export async function readProfileCollection(
  session: Session,
  username: string,
  { page, sort, search, rarities, wishlisted }: ProfileCollectionQuery,
): Promise<ProfileCollectionPage> {
  const action = `Reading the collection of player ${JSON.stringify(username)}`;
  const query = new URLSearchParams({ page, stats: "0" });
  if (sort !== undefined) query.set("sort", sort);
  if (search !== undefined) query.set("q", search);
  for (const rarity of rarities ?? []) query.append("rarity", rarity);
  if (wishlisted) query.set("wishlisted_by_me", "1");
  query.set("pending", "1");
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    "/trades",
    `/api/profile/${encodeURIComponent(username)}/collection?${query}`,
    { method: "GET" },
  );
  if (!isProfileCollectionResponse(body)) {
    throw new WikiMastersError(
      `${action} returned an unexpected response: ${JSON.stringify(body)}`,
    );
  }
  const pending = new Set(body.pendingTradeCardIds);
  return {
    entries: body.collection.map((row) => ({
      entryId: row.id,
      id: row.card.id,
      title: row.card.wikipedia_title,
      rarity: row.card.rarity,
      count: row.count,
      starred: row.starred,
      shiny: row.is_shiny,
      labels: row.tags.map(({ name }) => name),
      pendingTrade: pending.has(row.card.id),
    })),
    full: body.collection.length === PROFILE_COLLECTION_PAGE_SIZE,
  };
}
