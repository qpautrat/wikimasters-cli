import type { AuctionId } from "./auction.js";
import { WikiMastersError } from "./errors.js";
import { readAllPages } from "./paged-read.js";
import type { Session } from "./session.js";

export interface BidAuction {
  auctionId: AuctionId;
  title: string;
  myHighestBid: number;
  currentBid: number;
  leading: boolean;
  endsAt: string;
}

interface BidRow {
  auction_id: string;
  amount: number;
  auctions: {
    end_at: string;
    current_bid: number;
    current_bidder_id: string;
    cards: { wikipedia_title: string } | null;
  };
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
    if (!auction.cards) {
      throw new WikiMastersError(
        `Auction ${auction_id} has no readable card details`,
      );
    }
    auctions.set(auction_id, {
      auctionId: auction_id as AuctionId,
      title: auction.cards.wikipedia_title,
      myHighestBid: amount,
      currentBid: auction.current_bid,
      leading: auction.current_bidder_id === session.userId,
      endsAt: auction.end_at,
    });
  }
  return [...auctions.values()].sort(
    (a, b) =>
      Date.parse(a.endsAt) - Date.parse(b.endsAt) ||
      a.auctionId.localeCompare(b.auctionId),
  );
}
