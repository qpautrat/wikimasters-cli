import { WikiMastersError } from "./errors.js";
import { isObject } from "./object.js";

export function returnedStatus(
  action: string,
  body: unknown,
  effect: string,
): string {
  if (isObject(body) && typeof body.status === "string") return body.status;
  throw new WikiMastersError(
    `${action} returned an unexpected response, which may have ${effect} it: ${JSON.stringify(body)}`,
  );
}
