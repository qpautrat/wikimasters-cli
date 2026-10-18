import { WikiMastersError } from "./errors.js";
import { isObject } from "./object.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";
import type { TradeId } from "./trade-id.js";
import { TRADES_PAGE } from "./trades-page.js";

export interface CancelledTrade {
  tradeId: TradeId;
  status: string;
}

function cancelledTradeStatus(body: unknown): string | undefined {
  if (!isObject(body)) return undefined;
  return typeof body.status === "string" ? body.status : undefined;
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
  const status = cancelledTradeStatus(body);
  if (status === undefined) {
    throw new WikiMastersError(
      `${action} returned an unexpected response, which may have cancelled it: ${JSON.stringify(body)}`,
    );
  }
  return { tradeId, status };
}
