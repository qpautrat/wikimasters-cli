import { WikiMastersError } from "./errors.js";

export type CardId = string & { readonly __brand: "CardId" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseCardId(raw: string): CardId {
  const candidate = raw.trim().toLowerCase();
  if (!UUID.test(candidate)) {
    throw new WikiMastersError(`Invalid card id "${raw}": expected a UUID`);
  }
  return candidate as CardId;
}
