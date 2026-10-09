import { WikiMastersError } from "./errors.js";

export interface PositiveIntegerArgument {
  subject: string;
  unit?: string;
  untouched: string;
}

function isStrictlyPositiveInteger(raw: string): boolean {
  return /^[1-9][0-9]*$/.test(raw) && Number.isSafeInteger(Number(raw));
}

export function parseStrictlyPositiveInteger(
  raw: string,
  { subject, unit, untouched }: PositiveIntegerArgument,
): number {
  if (!isStrictlyPositiveInteger(raw)) {
    const ofUnit = unit === undefined ? "" : ` of ${unit}`;
    throw new WikiMastersError(
      `Invalid ${subject}: ${JSON.stringify(raw)} is not a strictly positive integer${ofUnit}; ${untouched}`,
    );
  }
  return Number(raw);
}
