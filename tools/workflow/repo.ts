import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface CommandOutcome {
  readonly code: number;
  readonly stdout: string;
}

export interface Repo {
  run(command: string, args: readonly string[]): Promise<CommandOutcome>;
  exists(path: string): boolean;
  read(path: string): string;
}

export function localRepo(root: string): Repo {
  return {
    run: (command, args) =>
      new Promise((resolve, reject) => {
        const child = spawn(command, args, {
          cwd: root,
          stdio: ["ignore", "pipe", "inherit"],
        });
        let stdout = "";
        child.stdout.setEncoding("utf8");
        child.stdout.on("data", (chunk: string) => {
          stdout += chunk;
        });
        child.on("error", reject);
        child.on("close", (code) => resolve({ code: code ?? 1, stdout }));
      }),
    exists: (path) => existsSync(join(root, path)),
    read: (path) => readFileSync(join(root, path), "utf8"),
  };
}
