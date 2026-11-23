import {
  auctionedTitle,
  leads,
  readAuction,
  type AuctionId,
  type AuctionRow,
} from "./auction.js";
import { apiFailure } from "./errors.js";
import { isFullPage, pageRange, type PageRequest } from "./page.js";
import type { Session } from "./session.js";

export const RUNNING_BIDS_LIMIT = 20;

export interface RunningBid {
  auctionId: AuctionId;
  title: string;
  amount: number;
  placedAt: string;
  currentBid: number | null;
  leading: boolean;
  endsAt: string;
}

export interface RunningBidPage {
  bids: RunningBid[];
  full: boolean;
}

interface BidRow {
  auction_id: AuctionId;
  amount: number;
  placed_at: string;
}

export async function listRunningBids(
  session: Session,
  request: PageRequest,
): Promise<RunningBidPage> {
  const [from, to] = pageRange(request);
  const { data, error, status } = await session.client
    .from("auction_bids")
    .select("auction_id, amount, placed_at")
    .eq("bidder_id", session.userId)
    .order("placed_at")
    .order("id")
    .range(from, to)
    .overrideTypes<BidRow[], { merge: false }>();
  if (error) throw apiFailure("Listing your bids", status, error.message);

  const auctions = new Map<AuctionId, AuctionRow>();
  const now = Date.now();
  const bids: RunningBid[] = [];
  for (const { auction_id, amount, placed_at } of data) {
    const auction =
      auctions.get(auction_id) ?? (await readAuction(session, auction_id));
    auctions.set(auction_id, auction);
    if (auction.status !== "active" || Date.parse(auction.end_at) <= now) {
      continue;
    }
    bids.push({
      auctionId: auction_id,
      title: auctionedTitle(auction_id, auction),
      amount,
      placedAt: placed_at,
      currentBid: auction.current_bid,
      leading: leads(session, auction),
      endsAt: auction.end_at,
    });
  }
  return { bids, full: isFullPage(data, request.limit) };
}
