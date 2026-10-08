import { describeTransientStatus, isTransientStatus } from "./transient.js";

export class WikiMastersError extends Error {
  override name = "WikiMastersError";
}

export class AuthRequiredError extends WikiMastersError {
  override name = "AuthRequiredError";
}

export class ApiUnavailableError extends WikiMastersError {
  override name = "ApiUnavailableError";
}

export function apiUnavailable(status: number): ApiUnavailableError {
  return new ApiUnavailableError(
    `WikiMasters API unavailable (HTTP ${status}: ${describeTransientStatus(status)}), retry later`,
  );
}

export function outcomeUnknown(
  action: string,
  status: number,
): ApiUnavailableError {
  return new ApiUnavailableError(
    `WikiMasters API unavailable (HTTP ${status}: ${describeTransientStatus(status)}) after the request was sent: ${action} may have taken effect, check before running the command again`,
  );
}

export function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

export function apiFailure(
  action: string,
  status: number,
  message: string,
): WikiMastersError {
  if (status === 401) {
    return new AuthRequiredError(
      `${action} was rejected: the session is no longer valid`,
    );
  }
  if (isTransientStatus(status)) return apiUnavailable(status);
  return new WikiMastersError(`${action} failed (HTTP ${status}): ${message}`);
}
