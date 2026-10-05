import type { CardId } from "./card-id.js";
import { WikiMastersError, apiFailure } from "./errors.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

const COLLECTION_PAGE = "/collection";

const WIKIBIDOUS_PER_DISCARD = 1;
const DISCARD_BATCH_SIZE = 100;

export interface DiscardFailure {
  cardId: CardId | null;
  reason: unknown;
}

export interface Discard {
  discarded: number;
  gained: number;
  balance: number;
  failed: DiscardFailure[];
}

interface CollectionEntry {
  id: string;
  card_id: CardId;
}

interface BulkDiscardResponse {
  balance: number;
  discarded_count: number;
  failed: unknown[];
}

function batches<Item>(items: readonly Item[]): Item[][] {
  const result: Item[][] = [];
  for (let from = 0; from < items.length; from += DISCARD_BATCH_SIZE) {
    result.push(items.slice(from, from + DISCARD_BATCH_SIZE));
  }
  return result;
}

async function collectionEntries(
  session: Session,
  cardIds: readonly CardId[],
): Promise<CollectionEntry[]> {
  const entries: CollectionEntry[] = [];
  for (const batch of batches(cardIds)) {
    const { data, error, status } = await session.client
      .from("user_cards")
      .select("id, card_id")
      .eq("user_id", session.userId)
      .in("card_id", batch)
      .gt("count", 0)
      .overrideTypes<CollectionEntry[], { merge: false }>();
    if (error) {
      throw apiFailure(
        "Reading the cards to discard in the collection",
        status,
        error.message,
      );
    }
    entries.push(...data);
  }

  const owned = new Set(entries.map(({ card_id }) => card_id));
  const missing = cardIds.filter((cardId) => !owned.has(cardId));
  if (missing.length > 0) {
    throw new WikiMastersError(
      `Not in your collection: ${missing.join(", ")}; nothing was discarded`,
    );
  }
  return entries;
}

function isBulkDiscardResponse(body: unknown): body is BulkDiscardResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "balance" in body &&
    typeof body.balance === "number" &&
    "discarded_count" in body &&
    typeof body.discarded_count === "number" &&
    "failed" in body &&
    Array.isArray(body.failed)
  );
}

async function bulkDiscard(
  session: Session,
  cookie: string,
  entryIds: readonly string[],
): Promise<BulkDiscardResponse> {
  const action = "Discarding cards";
  const body = await siteRequest(
    session,
    cookie,
    action,
    COLLECTION_PAGE,
    "/api/user-cards/bulk-discard",
    { method: "POST", body: { card_ids: entryIds } },
  );
  if (!isBulkDiscardResponse(body)) {
    throw new WikiMastersError(
      `${action} returned an unexpected response: ${JSON.stringify(body)}`,
    );
  }
  return body;
}

function mentionedStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value !== "object" || value === null) return [];
  return Object.values(value).flatMap(mentionedStrings);
}

function failedCard(
  entries: readonly CollectionEntry[],
  failure: unknown,
): CardId | null {
  const mentioned = new Set(mentionedStrings(failure));
  return (
    entries.find(
      ({ id, card_id }) => mentioned.has(id) || mentioned.has(card_id),
    )?.card_id ?? null
  );
}

export async function discardCards(
  session: Session,
  cardIds: readonly CardId[],
): Promise<Discard> {
  if (cardIds.length === 0) {
    throw new WikiMastersError("No card to discard was given");
  }
  const entries = await collectionEntries(session, [...new Set(cardIds)]);
  const cookie = await siteCookie(session);

  let discarded = 0;
  let balance = 0;
  const failed: DiscardFailure[] = [];
  for (const batch of batches(entries)) {
    try {
      const response = await bulkDiscard(
        session,
        cookie,
        batch.map(({ id }) => id),
      );
      discarded += response.discarded_count;
      balance = response.balance;
      failed.push(
        ...response.failed.map((reason) => ({
          cardId: failedCard(batch, reason),
          reason,
        })),
      );
    } catch (error) {
      if (error instanceof Error && discarded > 0) {
        error.message += ` (${discarded} cards were discarded before the failure)`;
      }
      throw error;
    }
  }
  return {
    discarded,
    gained: discarded * WIKIBIDOUS_PER_DISCARD,
    balance,
    failed,
  };
}
