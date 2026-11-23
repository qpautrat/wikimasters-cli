import { WikiMastersError } from "./errors.js";
import type { Session } from "./session.js";
import { parseStrictlyPositiveInteger } from "./integer.js";
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
  id: AuctionId;
  status: string;
  end_at: string;
  seller_id: string;
  base_amount: number;
  current_bid: number | null;
  current_bidder_id: string | null;
  snapshot_rarity: string;
  is_shiny: boolean;
  card: { wikipedia_title: string } | null;
}

interface BidResponse {
  current_bid: number;
  bidder_balance: number;
}

export function parseAuctionId(raw: string): AuctionId {
  return parseUuid(raw, "auction") as AuctionId;
}

export function parseAuctionLimit(raw: string): AuctionLimit {
  return parseStrictlyPositiveInteger(raw, {
    subject: "limit",
    untouched: "nothing was read",
  }) as AuctionLimit;
}

export function parseBidAmount(raw: string): BidAmount {
  return parseStrictlyPositiveInteger(raw, {
    subject: "bid amount",
    unit: "wikibidous",
    untouched: "nothing was bid",
  }) as BidAmount;
}

export function auctionedTitle(
  auctionId: string,
  { card }: Pick<AuctionRow, "card">,
): string {
  if (!card) {
    throw new WikiMastersError(
      `Auction ${auctionId} has no readable card details`,
    );
  }
  return card.wikipedia_title;
}

export function leads(
  session: Session,
  { current_bidder_id }: Pick<AuctionRow, "current_bidder_id">,
): boolean {
  return current_bidder_id === session.userId;
}

function isAuctionDetail(body: unknown): body is { auction: AuctionRow } {
  return (
    typeof body === "object" &&
    body !== null &&
    "auction" in body &&
    typeof body.auction === "object" &&
    body.auction !== null
  );
}

export async function readAuction(
  session: Session,
  auctionId: AuctionId,
): Promise<AuctionRow> {
  const action = "Reading the auction";
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    `/marketplace/${auctionId}`,
    `/api/marketplace/${auctionId}`,
    { method: "GET" },
  );
  if (!isAuctionDetail(body)) {
    throw new WikiMastersError(
      `${action} returned an unexpected response: ${JSON.stringify(body)}`,
    );
  }
  return body.auction;
}

export function toAuction(session: Session, row: AuctionRow): Auction {
  return {
    auctionId: row.id,
    title: auctionedTitle(row.id, row),
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
  return toAuction(session, await readAuction(session, auctionId));
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
