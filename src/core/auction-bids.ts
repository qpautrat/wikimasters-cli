import {
  auctionedTitle,
  leads,
  type AuctionId,
  type AuctionRow,
} from "./auction.js";
import { apiFailure } from "./errors.js";
import { pageRange, type PageRequest } from "./page.js";
import type { Session } from "./session.js";

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
  auction_id: string;
  amount: number;
  placed_at: string;
  auctions: Pick<
    AuctionRow,
    "end_at" | "current_bid" | "current_bidder_id" | "cards"
  >;
}

export async function listRunningBids(
  session: Session,
  request: PageRequest,
): Promise<RunningBidPage> {
  const [from, to] = pageRange(request);
  const { data, error, status } = await session.client
    .from("auction_bids")
    .select(
      "auction_id, amount, placed_at, auctions!inner(end_at, current_bid, current_bidder_id, cards(wikipedia_title))",
    )
    .eq("bidder_id", session.userId)
    .eq("auctions.status", "active")
    .gt("auctions.end_at", new Date().toISOString())
    .order("placed_at")
    .order("id")
    .range(from, to)
    .overrideTypes<BidRow[], { merge: false }>();
  if (error) throw apiFailure("Listing your bids", status, error.message);

  return {
    bids: data.map(({ auction_id, amount, placed_at, auctions: auction }) => ({
      auctionId: auction_id as AuctionId,
      title: auctionedTitle(auction_id, auction),
      amount,
      placedAt: placed_at,
      currentBid: auction.current_bid,
      leading: leads(session, auction),
      endsAt: auction.end_at,
    })),
    full: data.length === request.limit,
  };
}
