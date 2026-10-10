import { describe, expect, it } from "vitest";
import { WikiMastersError } from "./errors.js";
import { pageRange, parsePageLimit, parsePageNumber } from "./page.js";

describe("parsePageNumber and parsePageLimit", () => {
  it("refuse a page or a limit that is not a strictly positive integer", () => {
    expect(() => parsePageNumber("0")).toThrow(WikiMastersError);
    expect(() => parsePageLimit("-5")).toThrow(WikiMastersError);
    expect(() => parsePageLimit("ten")).toThrow(WikiMastersError);
  });
});

describe("pageRange", () => {
  it("covers the rows of the requested page", () => {
    expect(
      pageRange({ page: parsePageNumber("2"), limit: parsePageLimit("3") }),
    ).toEqual([3, 5]);
  });
});
