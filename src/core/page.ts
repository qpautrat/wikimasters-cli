import { parseStrictlyPositiveInteger } from "./integer.js";

export const PAGE_LIMIT = 1000;

export type PageNumber = number & { readonly __brand: "PageNumber" };
export type PageLimit = number & { readonly __brand: "PageLimit" };

export interface PageRequest {
  page: PageNumber;
  limit: PageLimit;
}

export function parsePageNumber(raw: string): PageNumber {
  return parseStrictlyPositiveInteger(raw, {
    subject: "page",
    untouched: "nothing was read",
  }) as PageNumber;
}

export function parsePageLimit(raw: string): PageLimit {
  return parseStrictlyPositiveInteger(raw, {
    subject: "limit",
    untouched: "nothing was read",
  }) as PageLimit;
}

export function pageRange({ page, limit }: PageRequest): [number, number] {
  const from = (page - 1) * limit;
  return [from, from + limit - 1];
}

export function isFullPage(rows: readonly unknown[], limit: number): boolean {
  return rows.length === limit;
}
