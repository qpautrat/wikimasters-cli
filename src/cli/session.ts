import {
  AuthRequiredError,
  resumeSession,
  type Session,
} from "../core/index.js";
import { loadConfig, requireRefreshToken, saveRefreshToken } from "./config.js";

const EXIT_AUTH_REQUIRED = 4;

export async function openSession(refreshToken?: string): Promise<Session> {
  const config = loadConfig();
  const session = await resumeSession({
    anonKey: config.anonKey,
    refreshToken: refreshToken ?? requireRefreshToken(config),
  });
  saveRefreshToken(session.refreshToken);
  return session;
}

export function reportFailure(command: string, error: unknown): void {
  console.error(
    `${command}: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode =
    error instanceof AuthRequiredError ? EXIT_AUTH_REQUIRED : 1;
}
