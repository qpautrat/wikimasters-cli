import {
  toAuction,
  type Auction,
  type AuctionId,
  type AuctionLimit,
  type AuctionRow,
} from "./auction.js";
import { WikiMastersError } from "./errors.js";
import { isStrictlyPositiveInteger } from "./positive-integer.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export type AuctionSearchPage = number & {
  readonly __brand: "AuctionSearchPage";
};

export function parseAuctionSearchPage(raw: string): AuctionSearchPage {
  if (!isStrictlyPositiveInteger(raw)) {
    throw new WikiMastersError(
      `Invalid page: ${JSON.stringify(raw)} is not a strictly positive integer; nothing was read`,
    );
  }
  return Number(raw) as AuctionSearchPage;
}

export interface AuctionSearch {
  auctions: Auction[];
  truncated: boolean;
}

type FoundAuctionRow = Omit<AuctionRow, "cards"> & {
  id: AuctionId;
  card: AuctionRow["cards"];
};

interface MarketplaceResponse {
  auctions: FoundAuctionRow[];
  hasMore: boolean;
}

function isMarketplaceResponse(body: unknown): body is MarketplaceResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "auctions" in body &&
    Array.isArray(body.auctions) &&
    "hasMore" in body &&
    typeof body.hasMore === "boolean"
  );
}

export async function searchAuctions(
  session: Session,
  text: string,
  limit: AuctionLimit,
  page: AuctionSearchPage,
): Promise<AuctionSearch> {
  const action = "Searching the auctions";
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort: "recent",
  });
  const trimmed = text.trim();
  if (trimmed) query.set("q", trimmed);
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    "/marketplace",
    `/api/marketplace?${query}`,
    { method: "GET" },
  );
  if (!isMarketplaceResponse(body)) {
    throw new WikiMastersError(
      `${action} returned an unexpected response: ${JSON.stringify(body)}`,
    );
  }
  return {
    auctions: body.auctions.map(({ id, card, ...row }) =>
      toAuction(session, id, { ...row, cards: card }),
    ),
    truncated: body.hasMore,
  };
}
