import { parseUuid } from "./uuid.js";

export type CardId = string & { readonly __brand: "CardId" };

export function parseCardId(raw: string): CardId {
  return parseUuid(raw, "card") as CardId;
}
