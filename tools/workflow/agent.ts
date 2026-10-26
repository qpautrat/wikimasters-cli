import { createInterface } from "node:readline/promises";
import {
  type CanUseTool,
  type HookCallback,
  type PermissionResult,
  query,
} from "@anthropic-ai/claude-agent-sdk";

export type JsonSchema = Record<string, unknown>;

export interface AgentTurn<T> {
  readonly output: T;
  readonly questionsAsked: number;
  readonly skillsInvoked: readonly string[];
}

export interface Agent {
  readonly sessionId: string | null;
  perform<T>(instructions: string, schema: JsonSchema): Promise<AgentTurn<T>>;
}

interface QuestionOption {
  readonly label: string;
  readonly description?: string;
}

interface Question {
  readonly question: string;
  readonly header?: string;
  readonly options?: readonly QuestionOption[];
  readonly multiSelect?: boolean;
}

const RUN_BY_THE_WORKFLOW = /\bgit\b[^|;&]*\bpush\b|release\.sh/;

const denyPushAndRelease: HookCallback = async (input) => {
  if (input.hook_event_name !== "PreToolUse") return {};
  const { command } = (input.tool_input ?? {}) as { command?: unknown };
  if (typeof command !== "string" || !RUN_BY_THE_WORKFLOW.test(command)) {
    return {};
  }
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        "The workflow pushes and releases itself; the agent never does.",
    },
  };
};

function chosenLabels(
  reply: string,
  options: readonly QuestionOption[],
): string {
  const labels = reply
    .split(",")
    .map((part) => options[Number.parseInt(part.trim(), 10) - 1]?.label)
    .filter((label) => label !== undefined);
  return labels.length > 0 ? labels.join(", ") : reply;
}

async function askInTerminal(questions: readonly Question[]) {
  const terminal = createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  const answers: Record<string, string> = {};
  try {
    for (const question of questions) {
      const options = question.options ?? [];
      process.stderr.write(
        `\n${question.header ? `${question.header} — ` : ""}${question.question}\n`,
      );
      options.forEach((option, index) => {
        process.stderr.write(
          `  ${index + 1}. ${option.label}${option.description ? ` — ${option.description}` : ""}\n`,
        );
      });
      const prompt = question.multiSelect
        ? "Numéros séparés par des virgules, ou réponse libre : "
        : "Numéro, ou réponse libre : ";
      const reply = (await terminal.question(prompt)).trim();
      answers[question.question] = chosenLabels(reply, options);
    }
  } finally {
    terminal.close();
  }
  return answers;
}

export function claudeAgent(cwd: string): Agent {
  let sessionId: string | null = null;
  return {
    get sessionId() {
      return sessionId;
    },
    async perform<T>(instructions: string, schema: JsonSchema) {
      let questionsAsked = 0;
      const skillsInvoked: string[] = [];
      const canUseTool: CanUseTool = async (
        toolName,
        input,
      ): Promise<PermissionResult> => {
        if (toolName !== "AskUserQuestion") {
          return { behavior: "allow", updatedInput: input };
        }
        questionsAsked += 1;
        const questions = (input.questions ?? []) as readonly Question[];
        const answers = await askInTerminal(questions);
        return { behavior: "allow", updatedInput: { ...input, answers } };
      };
      let output: T | undefined;
      for await (const message of query({
        prompt: instructions,
        options: {
          cwd,
          systemPrompt: { type: "preset", preset: "claude_code" },
          permissionMode: "default",
          canUseTool,
          hooks: {
            PreToolUse: [{ matcher: "Bash", hooks: [denyPushAndRelease] }],
          },
          outputFormat: { type: "json_schema", schema },
          ...(sessionId === null ? {} : { resume: sessionId }),
        },
      })) {
        if (message.type === "system" && message.subtype === "init") {
          sessionId = message.session_id;
        } else if (message.type === "assistant") {
          for (const block of message.message.content) {
            if (block.type === "text") process.stderr.write(`${block.text}\n`);
            if (block.type === "tool_use" && block.name === "Skill") {
              const { skill } = block.input as { skill?: unknown };
              if (typeof skill === "string") skillsInvoked.push(skill);
            }
          }
        } else if (message.type === "result") {
          if (message.subtype !== "success") {
            throw new Error(`l'agent s'est arrêté (${message.subtype})`);
          }
          output = message.structured_output as T;
        }
      }
      if (output === undefined) {
        throw new Error("l'agent n'a rendu aucun résultat structuré");
      }
      return { output, questionsAsked, skillsInvoked };
    },
  };
}
