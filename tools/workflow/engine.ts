export interface Check {
  readonly description: string;
  holds(): Promise<boolean>;
}

export interface StepResult {
  readonly decisions?: readonly string[];
  readonly openQuestions?: readonly string[];
  readonly unfixedFindings?: readonly string[];
  readonly unmet?: readonly string[];
}

export interface Step {
  readonly name: string;
  readonly requires: readonly Check[];
  readonly produces: readonly Check[];
  readonly agentDecides: readonly string[];
  run(): Promise<StepResult>;
}

export interface StepNote {
  readonly step: string;
  readonly text: string;
}

export interface Blocker {
  readonly step: string;
  readonly reasons: readonly string[];
}

export interface RunReport {
  readonly blocker: Blocker | null;
  readonly decisions: readonly StepNote[];
  readonly openQuestions: readonly StepNote[];
  readonly unfixedFindings: readonly StepNote[];
}

async function unmetChecks(checks: readonly Check[]): Promise<string[]> {
  const unmet: string[] = [];
  for (const check of checks) {
    if (!(await check.holds())) unmet.push(check.description);
  }
  return unmet;
}

export async function runWorkflow(
  steps: readonly Step[],
  onStepStart: (step: Step) => void = () => {},
): Promise<RunReport> {
  const decisions: StepNote[] = [];
  const openQuestions: StepNote[] = [];
  const unfixedFindings: StepNote[] = [];
  const report = (blocker: Blocker | null): RunReport => ({
    blocker,
    decisions,
    openQuestions,
    unfixedFindings,
  });
  const noted = (step: Step, texts: readonly string[] = []) =>
    texts.map((text) => ({ step: step.name, text }));

  for (const step of steps) {
    const missing = await unmetChecks(step.requires);
    if (missing.length > 0) {
      return report({
        step: step.name,
        reasons: missing.map((reason) => `prérequis manquant : ${reason}`),
      });
    }
    onStepStart(step);
    let result: StepResult;
    try {
      result = await step.run();
    } catch (error) {
      return report({
        step: step.name,
        reasons: [error instanceof Error ? error.message : String(error)],
      });
    }
    decisions.push(...noted(step, result.decisions));
    openQuestions.push(...noted(step, result.openQuestions));
    unfixedFindings.push(...noted(step, result.unfixedFindings));
    const unmet = [
      ...(result.unmet ?? []),
      ...(await unmetChecks(step.produces)),
    ];
    if (unmet.length > 0) {
      return report({
        step: step.name,
        reasons: unmet.map((reason) => `résultat non produit : ${reason}`),
      });
    }
  }
  return report(null);
}

function section(
  title: string,
  lines: readonly string[],
  none: string,
): string {
  const body = lines.length > 0 ? lines.join("\n") : none;
  return `## ${title}\n\n${body}`;
}

function bullets(items: readonly StepNote[]): string[] {
  return items.map(({ step, text }) => `- [${step}] ${text}`);
}

export function formatSummary(
  report: RunReport,
  sessionId: string | null,
): string {
  const { blocker } = report;
  const blockers =
    blocker === null
      ? []
      : blocker.reasons.map(
          (reason) => `- Run arrêté à l'étape ${blocker.step} : ${reason}`,
        );
  const retro =
    sessionId === null
      ? []
      : [
          `Lancer \`/mattpocock-skills:retro\` sur la session ? \`claude --resume ${sessionId}\``,
        ];
  return [
    section("Bloquants", blockers, "Aucun."),
    section("Questions", bullets(report.openQuestions), "Aucune."),
    section(
      "Décisions prises en ton nom",
      bullets(report.decisions),
      "Aucune.",
    ),
    section(
      "Findings de review non corrigés",
      bullets(report.unfixedFindings),
      "Aucun.",
    ),
    section("Rétro", retro, "Aucune session agent à analyser."),
  ].join("\n\n");
}
