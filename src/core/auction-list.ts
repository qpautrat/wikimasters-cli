import {
  AUCTION_COLUMNS,
  toAuction,
  type Auction,
  type AuctionId,
  type AuctionLimit,
  type AuctionRow,
} from "./auction.js";
import { apiFailure } from "./errors.js";
import type { Session } from "./session.js";

export interface AuctionFilter {
  status?: string;
}

type ListedAuctionRow = AuctionRow & { id: AuctionId };

export async function listAuctions(
  session: Session,
  { status }: AuctionFilter,
  limit: AuctionLimit,
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
