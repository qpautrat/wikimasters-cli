import { WikiMastersError, apiFailure } from "./errors.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

const COLLECTION_PAGE = "/collection";

const COMMON = "C";
const WIKIBIDOUS_PER_DISCARD = 1;
const DISCARD_BATCH_SIZE = 100;
const PAGE_SIZE = 1000;

export interface CommonsDiscard {
  discarded: number;
  gained: number;
  balance: number;
  failed: unknown[];
}

interface CollectionRow {
  id: string;
  card_id: string;
  snapshot_rarity: string;
  starred: boolean;
  is_shiny: boolean;
  user_card_tags: unknown[];
}

interface BulkDiscardResponse {
  balance: number;
  discarded_count: number;
  failed: unknown[];
}

async function pendingTradeIds(
  session: Session,
  cookie: string,
): Promise<Set<string>> {
  const action = "Listing the cards in pending trades";
  const body = await siteRequest(
    session,
    cookie,
    action,
    COLLECTION_PAGE,
    `/api/my-collection?sort=rarity&rarity=${COMMON}&page=0&stats=0`,
    { method: "GET" },
  );
  const ids =
    typeof body === "object" && body !== null && "pendingTradeCardIds" in body
      ? body.pendingTradeCardIds
      : undefined;
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string")) {
    throw new WikiMastersError(`${action} returned no pendingTradeCardIds`);
  }
  return new Set(ids);
}

async function listPlainCommons(session: Session): Promise<CollectionRow[]> {
  const rows: CollectionRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error, status } = await session.client
      .from("user_cards")
      .select(
        "id, card_id, snapshot_rarity, starred, is_shiny, user_card_tags(tag_id)",
      )
      .eq("user_id", session.userId)
      .eq("snapshot_rarity", COMMON)
      .is("starred", false)
      .is("is_shiny", false)
      .is("user_card_tags", null)
      .gt("count", 0)
      .order("id")
      .range(from, from + PAGE_SIZE - 1)
      .overrideTypes<CollectionRow[], { merge: false }>();
    if (error) {
      throw apiFailure("Listing the common cards", status, error.message);
    }
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  const unsafe = rows.find(
    (row) =>
      row.snapshot_rarity !== COMMON ||
      row.starred ||
      row.is_shiny ||
      row.user_card_tags.length > 0,
  );
  if (unsafe) {
    throw new WikiMastersError(
      `Collection entry ${unsafe.id} is not a plain common card; nothing was discarded`,
    );
  }
  return rows;
}

async function wikibidousBalance(session: Session): Promise<number> {
  const { data, error, status } = await session.client.rpc("get_my_profile");
  if (error) {
    throw apiFailure("Reading the profile", status, error.message);
  }
  const balance = (data as { wikibidous_balance?: unknown } | null)
    ?.wikibidous_balance;
  if (typeof balance !== "number") {
    throw new WikiMastersError("The profile holds no wikibidous balance");
  }
  return balance;
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
  userCardIds: readonly string[],
): Promise<BulkDiscardResponse> {
  const action = "Discarding cards";
  const body = await siteRequest(
    session,
    cookie,
    action,
    COLLECTION_PAGE,
    "/api/user-cards/bulk-discard",
    { method: "POST", body: { card_ids: userCardIds } },
  );
  if (!isBulkDiscardResponse(body)) {
    throw new WikiMastersError(
      `${action} returned an unexpected response: ${JSON.stringify(body)}`,
    );
  }
  return body;
}

export async function discardCommons(
  session: Session,
): Promise<CommonsDiscard> {
  const cookie = await siteCookie(session);
  const inTrade = await pendingTradeIds(session, cookie);
  const userCardIds = (await listPlainCommons(session))
    .filter(({ id, card_id }) => !inTrade.has(id) && !inTrade.has(card_id))
    .map(({ id }) => id);

  if (userCardIds.length === 0) {
    return {
      discarded: 0,
      gained: 0,
      balance: await wikibidousBalance(session),
      failed: [],
    };
  }

  let discarded = 0;
  let balance = 0;
  const failed: unknown[] = [];
  for (let from = 0; from < userCardIds.length; from += DISCARD_BATCH_SIZE) {
    try {
      const batch = await bulkDiscard(
        session,
        cookie,
        userCardIds.slice(from, from + DISCARD_BATCH_SIZE),
      );
      discarded += batch.discarded_count;
      balance = batch.balance;
      failed.push(...batch.failed);
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
