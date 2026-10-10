import { WikiMastersError } from "./errors.js";

export interface IntegerArgument {
  subject: string;
  unit?: string;
  untouched: string;
}

function parseMatching(
  raw: string,
  pattern: RegExp,
  kind: string,
  { subject, unit, untouched }: IntegerArgument,
): number {
  if (!pattern.test(raw) || !Number.isSafeInteger(Number(raw))) {
    const ofUnit = unit === undefined ? "" : ` of ${unit}`;
    throw new WikiMastersError(
      `Invalid ${subject}: ${JSON.stringify(raw)} is not ${kind}${ofUnit}; ${untouched}`,
    );
  }
  return Number(raw);
}

export function parseInteger(raw: string, argument: IntegerArgument): number {
  return parseMatching(raw, /^-?(0|[1-9][0-9]*)$/, "an integer", argument);
}

export function parseStrictlyPositiveInteger(
  raw: string,
  argument: IntegerArgument,
): number {
  return parseMatching(
    raw,
    /^[1-9][0-9]*$/,
    "a strictly positive integer",
    argument,
  );
}
