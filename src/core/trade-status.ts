import type { TradeId } from "./trade-id.js";

export interface TradeStatus {
  tradeId: TradeId;
  status: string;
}
