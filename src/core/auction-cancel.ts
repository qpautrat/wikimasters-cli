import type { AuctionId } from "./auction.js";
import { WikiMastersError } from "./errors.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export interface CancelledAuction {
  auctionId: AuctionId;
  status: string;
}

interface CancelledAuctionResponse {
  status: string;
}

function isCancelledAuctionResponse(
  body: unknown,
): body is CancelledAuctionResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "status" in body &&
    typeof body.status === "string"
  );
}

export async function cancelAuction(
  session: Session,
  auctionId: AuctionId,
): Promise<CancelledAuction> {
  const action = `Cancelling auction ${auctionId}`;
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    `/marketplace/${auctionId}`,
    `/api/marketplace/${auctionId}`,
    { method: "DELETE" },
  );
  if (!isCancelledAuctionResponse(body)) {
    throw new WikiMastersError(
      `${action} returned an unexpected response, which may have cancelled it: ${JSON.stringify(body)}`,
    );
  }
  return { auctionId, status: body.status };
}
