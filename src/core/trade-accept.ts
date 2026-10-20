import { WikiMastersError } from "./errors.js";
import { isObject } from "./object.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";
import type { TradeId } from "./trade-id.js";
import { TRADES_PAGE } from "./trades-page.js";

export interface AcceptedTrade {
  tradeId: TradeId;
  status: string;
}

export async function acceptTrade(
  session: Session,
  tradeId: TradeId,
): Promise<AcceptedTrade> {
  const action = `Accepting trade ${tradeId}`;
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    TRADES_PAGE,
    `/api/trades/${tradeId}`,
    { method: "PATCH", body: { action: "accept" } },
  );
  if (!isObject(body) || typeof body.status !== "string") {
    throw new WikiMastersError(
      `${action} returned an unexpected response, which may have accepted it: ${JSON.stringify(body)}`,
    );
  }
  return { tradeId, status: body.status };
}
