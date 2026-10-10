import { WikiMastersError } from "./errors.js";
import type { PositiveIntegerArgument } from "./positive-integer.js";

function isInteger(raw: string): boolean {
  return /^-?(0|[1-9][0-9]*)$/.test(raw) && Number.isSafeInteger(Number(raw));
}

export function parseInteger(
  raw: string,
  { subject, unit, untouched }: PositiveIntegerArgument,
): number {
  if (!isInteger(raw)) {
    const ofUnit = unit === undefined ? "" : ` of ${unit}`;
    throw new WikiMastersError(
      `Invalid ${subject}: ${JSON.stringify(raw)} is not an integer${ofUnit}; ${untouched}`,
    );
  }
  return Number(raw);
}
