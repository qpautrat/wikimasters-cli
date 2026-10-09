import type { AuctionId } from "./auction.js";
import type { CardId } from "./card-id.js";
import { readCollectionEntry } from "./collection-entry.js";
import { WikiMastersError } from "./errors.js";
import { parseStrictlyPositiveInteger } from "./positive-integer.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export type StartingPrice = number & { readonly __brand: "StartingPrice" };

export type AuctionDuration = number & { readonly __brand: "AuctionDuration" };

export interface CreatedAuction {
  auctionId: AuctionId;
}

interface AuctionedEntry {
  id: string;
}

interface CreatedAuctionResponse {
  auction_id: string;
}

export function parseStartingPrice(raw: string): StartingPrice {
  return parseStrictlyPositiveInteger(raw, {
    subject: "starting price",
    unit: "wikibidous",
    untouched: "nothing was put up for auction",
  }) as StartingPrice;
}

export function parseAuctionDuration(raw: string): AuctionDuration {
  return parseStrictlyPositiveInteger(raw, {
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
  cardId: CardId,
  startingPrice: StartingPrice,
  duration: AuctionDuration,
): Promise<CreatedAuction> {
  const entry = await readCollectionEntry<AuctionedEntry>(
    session,
    cardId,
    "id",
  );
  const action = `Putting card ${cardId} up for auction`;
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    "/collection",
    "/api/marketplace",
    {
      method: "POST",
      body: {
        card_id: entry.id,
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
