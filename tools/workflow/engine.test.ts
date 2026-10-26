import { describe, expect, it } from "vitest";
import {
  type Check,
  formatSummary,
  runWorkflow,
  type Step,
  type StepResult,
} from "./engine.js";

function check(description: string, holds: boolean): Check {
  return { description, holds: async () => holds };
}

function step(
  name: string,
  ran: string[],
  result: StepResult = {},
  overrides: Partial<Step> = {},
): Step {
  return {
    name,
    requires: [],
    produces: [],
    agentDecides: [],
    run: async () => {
      ran.push(name);
      return result;
    },
    ...overrides,
  };
}

describe("runWorkflow", () => {
  it("runs every step in order and reports no blocker", async () => {
    const ran: string[] = [];
    const report = await runWorkflow([step("a", ran), step("b", ran)]);
    expect(ran).toEqual(["a", "b"]);
    expect(report.blocker).toBeNull();
  });

  it("stops at a step whose result is not produced, naming it", async () => {
    const ran: string[] = [];
    const report = await runWorkflow([
      step("a", ran, {}, { produces: [check("tests pass", false)] }),
      step("b", ran),
    ]);
    expect(ran).toEqual(["a"]);
    expect(report.blocker).toEqual({
      step: "a",
      reasons: ["résultat non produit : tests pass"],
    });
  });

  it("stops at a step whose own verification fails", async () => {
    const ran: string[] = [];
    const report = await runWorkflow([
      step("a", ran, { unmet: ["criterion 2 is met"] }),
      step("b", ran),
    ]);
    expect(ran).toEqual(["a"]);
    expect(report.blocker?.reasons).toEqual([
      "résultat non produit : criterion 2 is met",
    ]);
  });

  it("does not start a step whose requirement is missing", async () => {
    const ran: string[] = [];
    const report = await runWorkflow([
      step("a", ran, {}, { requires: [check("clean tree", false)] }),
    ]);
    expect(ran).toEqual([]);
    expect(report.blocker).toEqual({
      step: "a",
      reasons: ["prérequis manquant : clean tree"],
    });
  });

  it("stops at a step that throws, with its message", async () => {
    const report = await runWorkflow([
      step("a", [], {}, { run: () => Promise.reject(new Error("boom")) }),
    ]);
    expect(report.blocker).toEqual({ step: "a", reasons: ["boom"] });
  });

  it("collects decisions, open questions and unfixed findings per step", async () => {
    const report = await runWorkflow([
      step("a", [], { decisions: ["d1"], openQuestions: ["q1"] }),
      step("b", [], { unfixedFindings: ["f1"] }),
    ]);
    expect(report.decisions).toEqual([{ step: "a", text: "d1" }]);
    expect(report.openQuestions).toEqual([{ step: "a", text: "q1" }]);
    expect(report.unfixedFindings).toEqual([{ step: "b", text: "f1" }]);
  });
});

describe("formatSummary", () => {
  it("always has the same sections, empty ones included", () => {
    const summary = formatSummary(
      {
        blocker: null,
        decisions: [],
        openQuestions: [],
        unfixedFindings: [],
      },
      null,
    );
    expect(summary.match(/^## .*/gm)).toEqual([
      "## Bloquants",
      "## Questions",
      "## Décisions prises en ton nom",
      "## Findings de review non corrigés",
      "## Rétro",
    ]);
  });

  it("names the step that stopped the run and the session to review", () => {
    const summary = formatSummary(
      {
        blocker: { step: "commit", reasons: ["tests pass"] },
        decisions: [{ step: "implémentation", text: "split the module" }],
        openQuestions: [],
        unfixedFindings: [],
      },
      "abc",
    );
    expect(summary).toContain("- Run arrêté à l'étape commit : tests pass");
    expect(summary).toContain("- [implémentation] split the module");
    expect(summary).toContain("claude --resume abc");
  });
});
