import { describe, expect, it } from "vitest";
import { WikiMastersError } from "./errors.js";
import { pageRange, parsePageLimit, parsePageNumber } from "./page.js";

describe("parsePageNumber", () => {
  it("refuses a page that is not a strictly positive integer", () => {
    expect(() => parsePageNumber("0")).toThrow(WikiMastersError);
    expect(() => parsePageNumber("two")).toThrow(WikiMastersError);
  });
});

describe("parsePageLimit", () => {
  it("keeps a zero or negative limit for the game to judge", () => {
    expect(parsePageLimit("0")).toBe(0);
    expect(parsePageLimit("-5")).toBe(-5);
  });

  it("refuses a limit that is not an integer", () => {
    expect(() => parsePageLimit("ten")).toThrow(WikiMastersError);
    expect(() => parsePageLimit("2.5")).toThrow(WikiMastersError);
  });
});

describe("pageRange", () => {
  it("covers the rows of the requested page", () => {
    expect(
      pageRange({ page: parsePageNumber("2"), limit: parsePageLimit("3") }),
    ).toEqual([3, 5]);
  });
});
