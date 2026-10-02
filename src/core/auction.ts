import { WikiMastersError, apiFailure } from "./errors.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";
import { parseUuid } from "./uuid.js";

export type AuctionId = string & { readonly __brand: "AuctionId" };

export interface PlacedBid {
  auctionId: AuctionId;
  amount: number;
  balance: number;
}

interface AuctionRow {
  status: string;
  end_at: string;
  seller_id: string;
  base_amount: number;
  current_bid: number | null;
}

interface BidResponse {
  current_bid: number;
  bidder_balance: number;
}

export function parseAuctionId(raw: string): AuctionId {
  return parseUuid(raw, "auction") as AuctionId;
}

export function minimumBid({
  base_amount,
  current_bid,
}: Pick<AuctionRow, "base_amount" | "current_bid">): number {
  // Same expression as the site's front-end, float rounding included: 1.1 * 200 rounds up to 221.
  return current_bid === null
    ? base_amount
    : Math.max(Math.ceil(1.1 * current_bid), current_bid + 1);
}

async function readAuction(
  session: Session,
  auctionId: AuctionId,
): Promise<AuctionRow> {
  const { data, error, status } = await session.client
    .from("auctions")
    .select("status, end_at, seller_id, base_amount, current_bid")
    .eq("id", auctionId)
    .maybeSingle()
    .overrideTypes<AuctionRow, { merge: false }>();
  if (error) {
    throw apiFailure("Reading the auction", status, error.message);
  }
  if (!data) throw new WikiMastersError(`Auction ${auctionId} not found`);
  return data;
}

function isBidResponse(body: unknown): body is BidResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "current_bid" in body &&
    typeof body.current_bid === "number" &&
    "bidder_balance" in body &&
    typeof body.bidder_balance === "number"
  );
}

export async function placeMinimumBid(
  session: Session,
  auctionId: AuctionId,
): Promise<PlacedBid> {
  const auction = await readAuction(session, auctionId);
  if (auction.status !== "active" || Date.parse(auction.end_at) <= Date.now()) {
    throw new WikiMastersError(
      `Auction ${auctionId} is no longer running (status ${auction.status}, ends ${auction.end_at}); nothing was bid`,
    );
  }
  if (auction.seller_id === session.userId) {
    throw new WikiMastersError(
      `Auction ${auctionId} is yours: you cannot bid on it; nothing was bid`,
    );
  }

  const amount = minimumBid(auction);
  const action = "Placing the bid";
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    `/marketplace/${auctionId}`,
    `/api/marketplace/${auctionId}/bid`,
    { method: "POST", body: { amount } },
  );
  if (!isBidResponse(body)) {
    throw new WikiMastersError(
      `${action} returned an unexpected response: ${JSON.stringify(body)}`,
    );
  }
  return { auctionId, amount, balance: body.bidder_balance };
}
