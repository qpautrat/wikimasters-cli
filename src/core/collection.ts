import { authCookieHeader } from "./auth-cookie.js";
import { WikiMastersError, apiFailure } from "./errors.js";
import type { Session } from "./session.js";
import { SITE_URL } from "./supabase.js";

const COMMON = "C";
const DISCARD_BATCH_SIZE = 50;
const PAGE_SIZE = 1000;

export interface CommonsDiscard {
  discarded: number;
  gained: number;
  balance: number;
  failed: unknown[];
}

interface CollectionRow {
  id: string;
  snapshot_rarity: string;
  starred: boolean;
  is_shiny: boolean;
}

interface BulkDiscardResponse {
  balance: number;
  discarded_count: number;
  failed: unknown[];
}

async function listDiscardableCommons(session: Session): Promise<string[]> {
  const rows: CollectionRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error, status } = await session.client
      .from("user_cards")
      .select("id, snapshot_rarity, starred, is_shiny")
      .eq("user_id", session.userId)
      .eq("snapshot_rarity", COMMON)
      .is("starred", false)
      .is("is_shiny", false)
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
    (row) => row.snapshot_rarity !== COMMON || row.starred || row.is_shiny,
  );
  if (unsafe) {
    throw new WikiMastersError(
      `Collection entry ${unsafe.id} is not a plain common card; nothing was discarded`,
    );
  }
  return rows.map(({ id }) => id);
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
  userCardIds: readonly string[],
): Promise<BulkDiscardResponse> {
  const { data, error } = await session.client.auth.getSession();
  if (error || !data.session) {
    throw new WikiMastersError("The session holds no access token");
  }
  const response = await session.fetch(
    `${SITE_URL}/api/user-cards/bulk-discard`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookieHeader(data.session),
      },
      body: JSON.stringify({ card_ids: userCardIds }),
    },
  );
  const text = await response.text();
  if (!response.ok) {
    throw apiFailure("Discarding cards", response.status, text);
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = undefined;
  }
  if (!isBulkDiscardResponse(body)) {
    throw new WikiMastersError(
      `Discarding cards returned an unexpected response: ${text}`,
    );
  }
  return body;
}

export async function discardCommons(
  session: Session,
): Promise<CommonsDiscard> {
  const userCardIds = await listDiscardableCommons(session);
  const initialBalance = await wikibidousBalance(session);

  const result: CommonsDiscard = {
    discarded: 0,
    gained: 0,
    balance: initialBalance,
    failed: [],
  };
  for (let from = 0; from < userCardIds.length; from += DISCARD_BATCH_SIZE) {
    const batch = await bulkDiscard(
      session,
      userCardIds.slice(from, from + DISCARD_BATCH_SIZE),
    );
    result.discarded += batch.discarded_count;
    result.balance = batch.balance;
    result.failed.push(...batch.failed);
  }
  result.gained = result.balance - initialBalance;
  return result;
}
