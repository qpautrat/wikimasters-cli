import { cancelledStatus } from "./cancelled-status.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";
import type { TradeId } from "./trade-id.js";
import { TRADES_PAGE } from "./trades-page.js";

export interface CancelledTrade {
  tradeId: TradeId;
  status: string;
}

export async function cancelTrade(
  session: Session,
  tradeId: TradeId,
): Promise<CancelledTrade> {
  const action = `Cancelling trade ${tradeId}`;
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    TRADES_PAGE,
    `/api/trades/${tradeId}`,
    { method: "PATCH", body: { action: "cancel" } },
  );
  return { tradeId, status: cancelledStatus(action, body) };
}
