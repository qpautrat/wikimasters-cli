import { WikiMastersError, apiFailure } from "./errors.js";
import type { Session } from "./session.js";
import { isStrictlyPositiveInteger } from "./positive-integer.js";
import { siteCookie, siteRequest } from "./site.js";
import { parseUuid } from "./uuid.js";

export type AuctionId = string & { readonly __brand: "AuctionId" };

export const AUCTION_LIMIT = 50;

export type AuctionLimit = number & { readonly __brand: "AuctionLimit" };

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

export const AUCTION_COLUMNS =
  "status, end_at, seller_id, base_amount, current_bid, current_bidder_id, snapshot_rarity, is_shiny, cards(wikipedia_title)";

interface BidResponse {
  current_bid: number;
  bidder_balance: number;
}

export function parseAuctionId(raw: string): AuctionId {
  return parseUuid(raw, "auction") as AuctionId;
}

export function parseAuctionLimit(raw: string): AuctionLimit {
  if (!isStrictlyPositiveInteger(raw)) {
    throw new WikiMastersError(
      `Invalid limit: ${JSON.stringify(raw)} is not a strictly positive integer; nothing was read`,
    );
  }
  return Number(raw) as AuctionLimit;
}

export function parseBidAmount(raw: string): BidAmount {
  if (!isStrictlyPositiveInteger(raw)) {
    throw new WikiMastersError(
      `Invalid bid amount: ${JSON.stringify(raw)} is not a strictly positive integer of wikibidous; nothing was bid`,
    );
  }
  return Number(raw) as BidAmount;
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
    .select(AUCTION_COLUMNS)
    .eq("id", auctionId)
    .maybeSingle()
    .overrideTypes<AuctionRow, { merge: false }>();
  if (error) {
    throw apiFailure("Reading the auction", status, error.message);
  }
  if (!data) throw new WikiMastersError(`Auction ${auctionId} not found`);
  return data;
}

export function toAuction(
  session: Session,
  auctionId: AuctionId,
  row: AuctionRow,
): Auction {
  return {
    auctionId,
    title: auctionedTitle(auctionId, row),
    rarity: row.snapshot_rarity,
    shiny: row.is_shiny,
    status: row.status,
    endsAt: row.end_at,
    startingPrice: row.base_amount,
    currentBid: row.current_bid,
    leading: leads(session, row),
    selling: row.seller_id === session.userId,
  };
}

export async function showAuction(
  session: Session,
  auctionId: AuctionId,
): Promise<Auction> {
  return toAuction(session, auctionId, await readAuction(session, auctionId));
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
