import type { Agent, AgentTurn, JsonSchema } from "./agent.js";
import type { Check, Step, StepResult } from "./engine.js";
import type { Repo } from "./repo.js";

export interface FeatureRun {
  readonly spec: string;
  readonly base: string;
  readonly agent: Agent;
  readonly repo: Repo;
}

const CODE_REVIEW_SKILL = "mattpocock-skills:code-review";

const stringList = { type: "array", items: { type: "string" } };

interface AgentStep<T> extends Omit<Step, "run"> {
  readonly instructions: string;
  readonly properties: Record<string, JsonSchema>;
  verify?(turn: AgentTurn<T>): string[];
  unfixedFindings?(output: T): string[];
}

interface Reported {
  readonly decisions: string[];
  readonly openQuestions: string[];
}

function agentStep<T>(run: FeatureRun, step: AgentStep<T>): Step {
  const schema = {
    type: "object",
    properties: {
      ...step.properties,
      decisions: stringList,
      openQuestions: stringList,
    },
    required: [...Object.keys(step.properties), "decisions", "openQuestions"],
  };
  const decides =
    step.agentDecides.length > 0
      ? `You decide: ${step.agentDecides.join("; ")}. Every other outcome of this step is imposed.`
      : "This step leaves you no decision: its outcome is imposed.";
  const instructions = [
    `Step "${step.name}" of the feature workflow for the spec \`${run.spec}\`. tools/workflow/steps.ts sets the order of the steps; do this step only, then stop.`,
    step.instructions,
    decides,
    "Ask the user, through AskUserQuestion only, solely when the spec is ambiguous or conflicts with the code, when your confidence in the spec is low and you submit your design, or before a write on the account during API discovery.",
    "List in `decisions` each decision taken on the user's behalf in this step, and in `openQuestions` each question for the user that does not block the run.",
    "Write in French: your text between tool calls, every string of the result, and the questions you ask.",
  ].join("\n\n");
  return {
    name: step.name,
    requires: step.requires,
    produces: step.produces,
    agentDecides: step.agentDecides,
    async run(): Promise<StepResult> {
      const turn = await run.agent.perform<T & Reported>(instructions, schema);
      const { output } = turn;
      return {
        decisions: output.decisions,
        openQuestions: output.openQuestions,
        unfixedFindings: step.unfixedFindings?.(output) ?? [],
        unmet: step.verify?.(turn) ?? [],
      };
    },
  };
}

function backlogPath(spec: string): string {
  return `specs/backlog/${spec}.md`;
}

export function acceptanceCriteria(spec: string): number[] {
  const section = spec
    .split(/^## /m)
    .find((part) => part.startsWith("Critères d'acceptation"));
  return [...(section ?? "").matchAll(/^(\d+)\. /gm)].map((match) =>
    Number(match[1]),
  );
}

function checks(run: FeatureRun) {
  const { repo, spec, base } = run;
  const git = async (...args: string[]) =>
    (await repo.run("git", args)).stdout.trim();
  const specPath = backlogPath(spec);
  const npmScript = (script: string): Check => ({
    description: `npm run ${script} passe`,
    holds: async () =>
      (await repo.run("npm", ["run", "-s", script])).code === 0,
  });
  return {
    onMain: {
      description: "la branche courante est main",
      holds: async () => (await git("branch", "--show-current")) === "main",
    },
    cleanTree: {
      description: "l'arbre de travail est propre",
      holds: async () => (await git("status", "--porcelain")) === "",
    },
    changedTree: {
      description: "l'arbre de travail porte des changements",
      holds: async () => (await git("status", "--porcelain")) !== "",
    },
    specInBacklog: {
      description: `${specPath} existe`,
      holds: async () => repo.exists(specPath),
    },
    specLeftBacklog: {
      description: `${specPath} a quitté le backlog et son ordre`,
      holds: async () =>
        !repo.exists(specPath) &&
        !repo.read("specs/backlog/README.md").includes(`${spec}.md`),
    },
    committed: {
      description: `de nouveaux commits suivent ${base}`,
      holds: async () => (await git("rev-parse", "HEAD")) !== base,
    },
    pushed: {
      description: "origin/main pointe sur HEAD",
      holds: async () =>
        (await git("rev-parse", "origin/main")) ===
        (await git("rev-parse", "HEAD")),
    },
    codeChecksPass: ["typecheck", "lint", "format:check", "test"].map(
      npmScript,
    ),
  };
}

interface Confidence {
  readonly confidence: "high" | "low";
}

interface Discovery {
  readonly accountWrites: number;
}

interface CriterionCheck {
  readonly number: number;
  readonly met: boolean;
  readonly evidence: string;
}

interface Acceptance {
  readonly criteria: readonly CriterionCheck[];
}

interface Finding {
  readonly finding: string;
  readonly reason: string;
}

interface ReviewFixes {
  readonly unfixed: readonly Finding[];
}

export function featureWorkflow(run: FeatureRun): readonly Step[] {
  const check = checks(run);
  const specPath = backlogPath(run.spec);
  return [
    agentStep<Confidence>(run, {
      name: "lecture de la spec",
      requires: [check.onMain, check.cleanTree, check.specInBacklog],
      produces: [check.cleanTree],
      agentDecides: [
        "whether the spec is ambiguous or conflicts with the code",
        "your confidence in the spec",
      ],
      instructions: `Read ${specPath} and the specs it relates to, as .claude/rules/specs.md says. Ask the user when it is ambiguous or conflicts with the code. Rate your confidence in it; when it is low, submit your design to the user before going on. Edit no file.`,
      properties: { confidence: { type: "string", enum: ["high", "low"] } },
      verify: ({ output, questionsAsked }) =>
        output.confidence === "low" && questionsAsked === 0
          ? ["la spec dont la confiance est faible a été soumise"]
          : [],
    }),
    agentStep<Discovery>(run, {
      name: "découverte de l'API",
      requires: [check.cleanTree],
      produces: [],
      agentDecides: [
        "whether the spec needs anything from the API",
        "the requests that establish each contract",
      ],
      instructions:
        "Discover what the spec needs from the API, as .claude/rules/api-discovery.md says, and nothing when it needs nothing. Count in `accountWrites` the writes sent to the account.",
      properties: { accountWrites: { type: "integer", minimum: 0 } },
      verify: ({ output, questionsAsked }) =>
        output.accountWrites > 0 && questionsAsked === 0
          ? [
              "chaque écriture sur le compte a été présentée avant d'être lancée",
            ]
          : [],
    }),
    agentStep(run, {
      name: "implémentation",
      requires: [check.specInBacklog],
      produces: [check.changedTree, ...check.codeChecksPass],
      agentDecides: ["the design of the code"],
      instructions: `Implement ${specPath}: code, tests, docs/api.md and README.md where the rules require it, and amend the spec with the decisions taken and what is coded, as .claude/rules/specs.md says. Leave the spec in specs/backlog/: the commit step moves it. Do not commit.`,
      properties: {},
    }),
    agentStep<Acceptance>(run, {
      name: "vérification des critères",
      requires: [check.changedTree, check.specInBacklog],
      produces: [check.changedTree, ...check.codeChecksPass],
      agentDecides: ["the data the account check runs against"],
      instructions: `Check each acceptance criterion of ${specPath} on the code and, for a command, on the account as CLAUDE.md says. Fix the code until each criterion is met. Report every criterion in \`criteria\` with the output that proves it. Do not commit.`,
      properties: {
        criteria: {
          type: "array",
          items: {
            type: "object",
            properties: {
              number: { type: "integer" },
              met: { type: "boolean" },
              evidence: { type: "string" },
            },
            required: ["number", "met", "evidence"],
          },
        },
      },
      verify: ({ output }) => {
        const reported = new Map(
          output.criteria.map((criterion) => [criterion.number, criterion]),
        );
        return acceptanceCriteria(run.repo.read(specPath))
          .filter((number) => reported.get(number)?.met !== true)
          .map((number) => `le critère ${number} est vérifié`);
      },
    }),
    agentStep(run, {
      name: "commit",
      requires: [check.changedTree],
      produces: [check.cleanTree, check.committed, check.specLeftBacklog],
      agentDecides: ["how the change splits into atomic commits"],
      instructions:
        "Commit the increment as CLAUDE.md and .claude/rules/specs.md say, the spec leaving specs/backlog/ and its order in specs/backlog/README.md in the implementing commit.",
      properties: {},
    }),
    agentStep(run, {
      name: "review",
      requires: [check.cleanTree, check.committed],
      produces: [check.cleanTree],
      agentDecides: [],
      instructions: `Run /${CODE_REVIEW_SKILL} with ${run.base} as the fixed point. Fix nothing yet. Wait for both reports before answering, and list each finding in \`findings\`, one line each.`,
      properties: { findings: stringList },
      verify: ({ skillsInvoked }) =>
        skillsInvoked.includes(CODE_REVIEW_SKILL)
          ? []
          : [`le skill ${CODE_REVIEW_SKILL} a été lancé`],
    }),
    agentStep<ReviewFixes>(run, {
      name: "correction des findings",
      requires: [check.cleanTree],
      produces: [check.cleanTree, ...check.codeChecksPass],
      agentDecides: ["which findings are valid"],
      instructions:
        "Fix the review's valid findings and commit the fixes. A finding the change leaves stale in another file (README, spec) is fixed too, amending that file's spec in the same commit; leave unfixed only a finding the spec puts out of scope. Run no new review. Report in `unfixed` each finding left unfixed, with its reason.",
      properties: {
        unfixed: {
          type: "array",
          items: {
            type: "object",
            properties: {
              finding: { type: "string" },
              reason: { type: "string" },
            },
            required: ["finding", "reason"],
          },
        },
      },
      unfixedFindings: (output) =>
        output.unfixed.map(({ finding, reason }) => `${finding} (${reason})`),
    }),
    {
      name: "push",
      requires: [check.onMain, check.cleanTree, check.committed],
      produces: [check.pushed],
      agentDecides: [],
      run: async () => {
        await run.repo.run("git", ["push", "origin", "main"]);
        return {};
      },
    },
    {
      name: "release",
      requires: [check.cleanTree, check.pushed],
      produces: [check.cleanTree, check.pushed],
      agentDecides: [],
      run: async () => {
        const { code } = await run.repo.run("scripts/release.sh", []);
        return code === 0 ? {} : { unmet: ["scripts/release.sh réussit"] };
      },
    },
  ];
}
