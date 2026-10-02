import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { AuthRequiredError, WikiMastersError } from "../core/index.js";

export const DEFAULT_ENV_FILE = fileURLToPath(
  new URL("../../.env", import.meta.url),
);

const ANON_KEY = "WKM_SUPABASE_ANON_KEY";
const REFRESH_TOKEN = "WKM_REFRESH_TOKEN";

type Env = Record<string, string | undefined>;

export interface Config {
  anonKey: string;
  refreshToken: string | undefined;
}

export function loadConfig(
  envFile = DEFAULT_ENV_FILE,
  env: Env = process.env,
): Config {
  const fileEnv: Env = existsSync(envFile)
    ? parseEnv(readFileSync(envFile, "utf8"))
    : {};
  const read = (name: string) => fileEnv[name] || env[name] || undefined;

  const anonKey = read(ANON_KEY);
  if (!anonKey) {
    throw new WikiMastersError(`Missing ${ANON_KEY}: set it in ${envFile}`);
  }
  return { anonKey, refreshToken: read(REFRESH_TOKEN) };
}

export function requireRefreshToken(config: Config): string {
  if (!config.refreshToken) {
    throw new AuthRequiredError("Not logged in");
  }
  return config.refreshToken;
}

export function saveRefreshToken(
  refreshToken: string,
  envFile = DEFAULT_ENV_FILE,
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
  writeFileSync(envFile, content.endsWith("\n") ? content : `${content}\n`, {
    mode: 0o600,
  });
  chmodSync(envFile, 0o600);
}
