import type { AuctionId } from "./auction.js";
import { COLLECTION_PAGE } from "./collection.js";
import type { EntryId } from "./entry-id.js";
import { WikiMastersError } from "./errors.js";
import { parseInteger } from "./integer.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export type StartingPrice = number & { readonly __brand: "StartingPrice" };

export type AuctionDuration = number & { readonly __brand: "AuctionDuration" };

export interface CreatedAuction {
  auctionId: AuctionId;
}

interface CreatedAuctionResponse {
  auction_id: string;
}

export function parseStartingPrice(raw: string): StartingPrice {
  return parseInteger(raw, {
    subject: "starting price",
    unit: "wikibidous",
    untouched: "nothing was put up for auction",
  }) as StartingPrice;
}

export function parseAuctionDuration(raw: string): AuctionDuration {
  return parseInteger(raw, {
    subject: "duration",
    unit: "minutes",
    untouched: "nothing was put up for auction",
  }) as AuctionDuration;
}

function isCreatedAuctionResponse(
  body: unknown,
): body is CreatedAuctionResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "auction_id" in body &&
    typeof body.auction_id === "string"
  );
}

export async function createAuction(
  session: Session,
  entryId: EntryId,
  startingPrice: StartingPrice,
  duration: AuctionDuration,
): Promise<CreatedAuction> {
  const action = `Putting entry ${entryId} up for auction`;
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    COLLECTION_PAGE,
    "/api/marketplace",
    {
      method: "POST",
      body: {
        card_id: entryId,
        base_amount: startingPrice,
        duration_minutes: duration,
      },
    },
  );
  if (!isCreatedAuctionResponse(body)) {
    throw new WikiMastersError(
      `${action} returned an unexpected response, which may have put it up for auction: ${JSON.stringify(body)}`,
    );
  }
  return { auctionId: body.auction_id as AuctionId };
}
