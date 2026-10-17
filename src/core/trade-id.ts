export type TradeId = string & { readonly __brand: "TradeId" };

export function asTradeId(raw: string): TradeId {
  return raw as TradeId;
}
