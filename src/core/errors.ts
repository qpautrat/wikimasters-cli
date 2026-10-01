export class WikiMastersError extends Error {
  override name = 'WikiMastersError';
}

export class AuthRequiredError extends WikiMastersError {
  override name = 'AuthRequiredError';

  constructor(reason: string) {
    super(`${reason}: run \`wkm login\``);
  }
}

export function apiFailure(action: string, status: number, message: string): WikiMastersError {
  return status === 401
    ? new AuthRequiredError(`${action} was rejected: the session is no longer valid`)
    : new WikiMastersError(`${action} failed (HTTP ${status}): ${message}`);
}
