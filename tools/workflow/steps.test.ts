import { describe, expect, it } from "vitest";
import { acceptanceCriteria } from "./steps.js";

describe("acceptanceCriteria", () => {
  it("numbers the criteria of the acceptance section only", () => {
    const spec = [
      "# Titre",
      "## Contexte",
      "1. not a criterion",
      "## Critères d'acceptation",
      "",
      "1. first",
      "2. second",
      "   continued",
      "3. third",
      "## Hors périmètre",
      "1. not a criterion either",
    ].join("\n");
    expect(acceptanceCriteria(spec)).toEqual([1, 2, 3]);
  });
});
