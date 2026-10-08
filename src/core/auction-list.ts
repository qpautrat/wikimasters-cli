import {
  AUCTION_COLUMNS,
  toAuction,
  type Auction,
  type AuctionId,
  type AuctionRow,
} from "./auction.js";
import { WikiMastersError, apiFailure } from "./errors.js";
import { isStrictlyPositiveInteger } from "./positive-integer.js";
import type { Session } from "./session.js";

export const AUCTION_LIST_LIMIT = 50;

export type AuctionListLimit = number & {
  readonly __brand: "AuctionListLimit";
};

export interface AuctionFilter {
  status?: string;
}

type ListedAuctionRow = AuctionRow & { id: AuctionId };

export function parseAuctionListLimit(raw: string): AuctionListLimit {
  if (!isStrictlyPositiveInteger(raw)) {
    throw new WikiMastersError(
      `Invalid limit: ${JSON.stringify(raw)} is not a strictly positive integer; nothing was read`,
    );
  }
  return Number(raw) as AuctionListLimit;
}

export async function listAuctions(
  session: Session,
  { status }: AuctionFilter,
  limit: AuctionListLimit,
): Promise<Auction[]> {
  const query = session.client
    .from("auctions")
    .select(`id, ${AUCTION_COLUMNS}`)
    .limit(limit);
  const {
    data,
    error,
    status: httpStatus,
  } = await (status === undefined
    ? query
    : query.eq("status", status)
  ).overrideTypes<ListedAuctionRow[], { merge: false }>();
  if (error) {
    throw apiFailure("Listing the auctions", httpStatus, error.message);
  }
  return data.map((row) => toAuction(session, row.id, row));
}
