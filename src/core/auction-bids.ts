import {
  auctionedTitle,
  leads,
  type AuctionId,
  type AuctionRow,
} from "./auction.js";
import { readAllPages } from "./paged-read.js";
import type { Session } from "./session.js";

export interface BidAuction {
  auctionId: AuctionId;
  title: string;
  myHighestBid: number;
  currentBid: number | null;
  leading: boolean;
  endsAt: string;
}

interface BidRow {
  auction_id: string;
  amount: number;
  auctions: Pick<
    AuctionRow,
    "end_at" | "current_bid" | "current_bidder_id" | "cards"
  >;
}

export async function listRunningBids(session: Session): Promise<BidAuction[]> {
  const now = new Date().toISOString();
  const rows = await readAllPages("Listing your bids", (from, to) =>
    session.client
      .from("auction_bids")
      .select(
        "auction_id, amount, auctions!inner(end_at, current_bid, current_bidder_id, cards(wikipedia_title))",
      )
      .eq("bidder_id", session.userId)
      .eq("auctions.status", "active")
      .gt("auctions.end_at", now)
      .order("placed_at")
      .order("id")
      .range(from, to)
      .overrideTypes<BidRow[], { merge: false }>(),
  );

  const auctions = new Map<string, BidAuction>();
  for (const { auction_id, amount, auctions: auction } of rows) {
    const known = auctions.get(auction_id);
    if (known) {
      known.myHighestBid = Math.max(known.myHighestBid, amount);
      continue;
    }
    auctions.set(auction_id, {
      auctionId: auction_id as AuctionId,
      title: auctionedTitle(auction_id, auction),
      myHighestBid: amount,
      currentBid: auction.current_bid,
      leading: leads(session, auction),
      endsAt: auction.end_at,
    });
  }
  return [...auctions.values()].sort(
    (a, b) =>
      Date.parse(a.endsAt) - Date.parse(b.endsAt) ||
      a.auctionId.localeCompare(b.auctionId),
  );
}
