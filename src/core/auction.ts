import { WikiMastersError, apiFailure } from "./errors.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";
import { parseUuid } from "./uuid.js";

export type AuctionId = string & { readonly __brand: "AuctionId" };

export type BidAmount = number & { readonly __brand: "BidAmount" };

export interface PlacedBid {
  auctionId: AuctionId;
  amount: number;
  balance: number;
}

export interface Auction {
  auctionId: AuctionId;
  title: string;
  rarity: string;
  shiny: boolean;
  status: string;
  endsAt: string;
  startingPrice: number;
  currentBid: number | null;
  leading: boolean;
  selling: boolean;
  minimumBid: number;
}

export interface AuctionRow {
  status: string;
  end_at: string;
  seller_id: string;
  base_amount: number;
  current_bid: number | null;
  current_bidder_id: string | null;
  snapshot_rarity: string;
  is_shiny: boolean;
  cards: { wikipedia_title: string } | null;
}

interface BidResponse {
  current_bid: number;
  bidder_balance: number;
}

export function parseAuctionId(raw: string): AuctionId {
  return parseUuid(raw, "auction") as AuctionId;
}

export function parseBidAmount(raw: string): BidAmount {
  const amount = Number(raw);
  if (!/^[1-9][0-9]*$/.test(raw) || !Number.isSafeInteger(amount)) {
    throw new WikiMastersError(
      `Invalid bid amount: ${JSON.stringify(raw)} is not a strictly positive integer of wikibidous; nothing was bid`,
    );
  }
  return amount as BidAmount;
}

export function minimumBid({
  base_amount,
  current_bid,
}: Pick<AuctionRow, "base_amount" | "current_bid">): number {
  // Same expression as the site's front-end, float rounding included (docs/game-rules.md): 1.1 * 200 rounds up to 221.
  return current_bid === null
    ? base_amount
    : Math.max(Math.ceil(1.1 * current_bid), current_bid + 1);
}

export function auctionedTitle(
  auctionId: string,
  { cards }: Pick<AuctionRow, "cards">,
): string {
  if (!cards) {
    throw new WikiMastersError(
      `Auction ${auctionId} has no readable card details`,
    );
  }
  return cards.wikipedia_title;
}

export function leads(
  session: Session,
  { current_bidder_id }: Pick<AuctionRow, "current_bidder_id">,
): boolean {
  return current_bidder_id === session.userId;
}

async function readAuction(
  session: Session,
  auctionId: AuctionId,
): Promise<AuctionRow> {
  const { data, error, status } = await session.client
    .from("auctions")
    .select(
      "status, end_at, seller_id, base_amount, current_bid, current_bidder_id, snapshot_rarity, is_shiny, cards(wikipedia_title)",
    )
    .eq("id", auctionId)
    .maybeSingle()
    .overrideTypes<AuctionRow, { merge: false }>();
  if (error) {
    throw apiFailure("Reading the auction", status, error.message);
  }
  if (!data) throw new WikiMastersError(`Auction ${auctionId} not found`);
  return data;
}

export async function showAuction(
  session: Session,
  auctionId: AuctionId,
): Promise<Auction> {
  const auction = await readAuction(session, auctionId);
  return {
    auctionId,
    title: auctionedTitle(auctionId, auction),
    rarity: auction.snapshot_rarity,
    shiny: auction.is_shiny,
    status: auction.status,
    endsAt: auction.end_at,
    startingPrice: auction.base_amount,
    currentBid: auction.current_bid,
    leading: leads(session, auction),
    selling: auction.seller_id === session.userId,
    minimumBid: minimumBid(auction),
  };
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

export async function placeBid(
  session: Session,
  auctionId: AuctionId,
  amount: BidAmount,
): Promise<PlacedBid> {
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
  return { auctionId, amount: body.current_bid, balance: body.bidder_balance };
}
