import {
  ApiUnavailableError,
  AuthRequiredError,
  resumeSession,
  type Session,
} from "../core/index.js";
import {
  loadConfig,
  packageRoot,
  requireRefreshToken,
  saveRefreshToken,
} from "./config.js";

const EXIT_AUTH_REQUIRED = 4;
const EXIT_TEMPORARY_FAILURE = 75;

export async function openSession(refreshToken?: string): Promise<Session> {
  const config = loadConfig();
  const session = await resumeSession({
    anonKey: config.anonKey,
    refreshToken: refreshToken ?? requireRefreshToken(config),
  });
  saveRefreshToken(session.refreshToken);
  return session;
}

function shellQuote(argument: string): string {
  return `'${argument.replaceAll("'", "'\\''")}'`;
}

export function loginCommand(root = packageRoot()): string {
  return `mise -C ${shellQuote(root)} run wikimasters -- login`;
}

function failureMessage(error: unknown): string {
  if (error instanceof AuthRequiredError) {
    return `${error.message}: run \`${loginCommand()}\``;
  }
  return error instanceof Error ? error.message : String(error);
}

export function reportFailure(command: string, error: unknown): void {
  console.error(`${command}: ${failureMessage(error)}`);
  process.exitCode =
    error instanceof AuthRequiredError
      ? EXIT_AUTH_REQUIRED
      : error instanceof ApiUnavailableError
        ? EXIT_TEMPORARY_FAILURE
        : 1;
}
