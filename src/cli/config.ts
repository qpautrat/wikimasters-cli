import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { AuthRequiredError, WikiMastersError } from "../core/index.js";

export function packageRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(join(dir, "package.json"))) {
    const parent = dirname(dir);
    if (parent === dir) {
      throw new WikiMastersError("No package.json above the CLI");
    }
    dir = parent;
  }
  return dir;
}

const ANON_KEY = "WIKIMASTERS_SUPABASE_ANON_KEY";
const REFRESH_TOKEN = "WIKIMASTERS_REFRESH_TOKEN";

type Env = Record<string, string | undefined>;

export function sessionFile(env: Env = process.env): string {
  const configHome = env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(configHome, "wikimasters-cli", ".env");
}

export interface Config {
  anonKey: string | undefined;
  refreshToken: string | undefined;
}

export function loadConfig(
  envFile = sessionFile(),
  env: Env = process.env,
): Config {
  const fileEnv: Env = existsSync(envFile)
    ? parseEnv(readFileSync(envFile, "utf8"))
    : {};
  const read = (name: string) => fileEnv[name] || env[name] || undefined;

  return {
    anonKey: read(ANON_KEY),
    refreshToken: read(REFRESH_TOKEN),
  };
}

export function requireRefreshToken(config: Config): string {
  if (!config.refreshToken) {
    throw new AuthRequiredError("Not logged in");
  }
  return config.refreshToken;
}

export function saveRefreshToken(
  refreshToken: string,
  envFile = sessionFile(),
): void {
  const line = `${REFRESH_TOKEN}=${refreshToken}`;
  const lines = existsSync(envFile)
    ? readFileSync(envFile, "utf8").split("\n")
    : [];
  const index = lines.findIndex((existing) =>
    existing.startsWith(`${REFRESH_TOKEN}=`),
  );
  if (index === -1) {
    lines.splice(
      lines.at(-1) === "" ? lines.length - 1 : lines.length,
      0,
      line,
    );
  } else {
    lines[index] = line;
  }
  const content = lines.join("\n");
  mkdirSync(dirname(envFile), { recursive: true });
  writeFileSync(envFile, content.endsWith("\n") ? content : `${content}\n`, {
    mode: 0o600,
  });
  chmodSync(envFile, 0o600);
}
