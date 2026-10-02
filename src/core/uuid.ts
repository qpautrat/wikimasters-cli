import { WikiMastersError } from "./errors.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseUuid(raw: string, entity: string): string {
  const candidate = raw.trim().toLowerCase();
  if (!UUID.test(candidate)) {
    throw new WikiMastersError(
      `Invalid ${entity} id "${raw}": expected a UUID`,
    );
  }
  return candidate;
}
