import { returnedStatus } from "./returned-status.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";
import type { TradeId } from "./trade-id.js";
import type { TradeStatus } from "./trade-status.js";
import { TRADES_PAGE } from "./trades-page.js";

export async function cancelTrade(
  session: Session,
  tradeId: TradeId,
): Promise<TradeStatus> {
  const action = `Cancelling trade ${tradeId}`;
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    TRADES_PAGE,
    `/api/trades/${tradeId}`,
    { method: "PATCH", body: { action: "cancel" } },
  );
  return { tradeId, status: returnedStatus(action, body, "cancelled") };
}
