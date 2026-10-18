import { WikiMastersError } from "./errors.js";
import { isObject } from "./object.js";

export function cancelledStatus(action: string, body: unknown): string {
  if (isObject(body) && typeof body.status === "string") return body.status;
  throw new WikiMastersError(
    `${action} returned an unexpected response, which may have cancelled it: ${JSON.stringify(body)}`,
  );
}
