import { toAuction, type Auction, type AuctionLimit } from "./auction.js";
import { isMarketplaceResponse } from "./auction-search.js";
import { WikiMastersError } from "./errors.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export async function listAuctions(
  session: Session,
  limit: AuctionLimit,
): Promise<Auction[]> {
  const action = "Listing the auctions";
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    "/marketplace",
    `/api/marketplace?${new URLSearchParams({ limit: String(limit) })}`,
    { method: "GET" },
  );
  if (!isMarketplaceResponse(body)) {
    throw new WikiMastersError(
      `${action} returned an unexpected response: ${JSON.stringify(body)}`,
    );
  }
  return body.auctions.map((row) => toAuction(session, row));
}
