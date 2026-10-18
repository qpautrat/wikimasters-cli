import type { AuctionId } from "./auction.js";
import { cancelledStatus } from "./cancelled-status.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export interface CancelledAuction {
  auctionId: AuctionId;
  status: string;
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
  return { auctionId, status: cancelledStatus(action, body) };
}
