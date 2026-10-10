import { asEntryId, type EntryId } from "./entry-id.js";
import { WikiMastersError } from "./errors.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export const COLLECTION_PAGE = "/collection";

const WIKIBIDOUS_PER_DISCARD = 1;

export interface DiscardFailure {
  entryId: EntryId;
  reason: string;
}

export interface Discard {
  discarded: number;
  gained: number;
  balance: number;
  failed: DiscardFailure[];
}

interface BulkDiscardResponse {
  balance: number;
  discarded_count: number;
  failed: { card_id: string; error: string }[];
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
    Array.isArray(body.failed) &&
    body.failed.every(
      (failure: unknown) =>
        typeof failure === "object" &&
        failure !== null &&
        "card_id" in failure &&
        typeof failure.card_id === "string" &&
        "error" in failure &&
        typeof failure.error === "string",
    )
  );
}

function accountsForEntriesSent(
  entryIds: readonly EntryId[],
  response: BulkDiscardResponse,
): boolean {
  const sent = new Set<string>(entryIds);
  return (
    response.discarded_count + response.failed.length === entryIds.length &&
    response.failed.every(({ card_id }) => sent.has(card_id))
  );
}

export async function discardEntries(
  session: Session,
  entryIds: readonly EntryId[],
): Promise<Discard> {
  if (entryIds.length === 0) {
    throw new WikiMastersError("No entry to discard was given");
  }
  const action = "Discarding entries";
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    COLLECTION_PAGE,
    "/api/user-cards/bulk-discard",
    { method: "POST", body: { card_ids: entryIds } },
  );
  if (!isBulkDiscardResponse(body) || !accountsForEntriesSent(entryIds, body)) {
    throw new WikiMastersError(
      `${action} returned an unexpected response, which may have discarded some of the ${entryIds.length} entries sent: ${JSON.stringify(body)}`,
    );
  }
  return {
    discarded: body.discarded_count,
    gained: body.discarded_count * WIKIBIDOUS_PER_DISCARD,
    balance: body.balance,
    failed: body.failed.map(({ card_id, error }) => ({
      entryId: asEntryId(card_id),
      reason: error,
    })),
  };
}
