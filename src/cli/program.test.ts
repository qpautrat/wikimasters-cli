import type { Command } from "commander";
import { describe, expect, it } from "vitest";
import { program } from "./program.js";

function leafCommands(command: Command): Command[] {
  return command.commands.length === 0
    ? [command]
    : command.commands.flatMap(leafCommands);
}

function invocation(command: Command): string {
  return command.parent
    ? `${invocation(command.parent)} ${command.name()}`
    : command.name();
}

function helpOutput(command: Command): string {
  let output = "";
  const previous = command.configureOutput();
  command.configureOutput({ writeOut: (text) => (output += text) });
  command.outputHelp();
  command.configureOutput(previous);
  return output;
}

function examplesOf(command: Command): string[] {
  const [, section = ""] = helpOutput(command).split("\nExamples:\n");
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("$ "))
    .map((line) => line.slice(2));
}

describe.each(
  leafCommands(program).map((command) => [invocation(command), command]),
)("%s --help", (name, command) => {
  it("shows at least one example calling the command", () => {
    const examples = examplesOf(command);
    expect(examples.length).toBeGreaterThan(0);
    for (const example of examples) {
      expect(example === name || example.startsWith(`${name} `)).toBe(true);
    }
  });

  it("uses one of the command's own options in an example", () => {
    const flags = command.options.flatMap((option) => option.long ?? []);
    if (flags.length === 0) return;
    const examples = examplesOf(command);
    expect(
      examples.some((example) =>
        flags.some((flag) => example.split(" ").includes(flag)),
      ),
    ).toBe(true);
  });
});
