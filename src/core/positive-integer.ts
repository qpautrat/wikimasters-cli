export function isStrictlyPositiveInteger(raw: string): boolean {
  return /^[1-9][0-9]*$/.test(raw) && Number.isSafeInteger(Number(raw));
}
