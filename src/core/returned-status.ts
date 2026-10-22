import { unexpectedWriteResponse } from "./errors.js";
import { isObject } from "./object.js";

export function returnedStatus(
  action: string,
  body: unknown,
  effect: string,
): string {
  if (isObject(body) && typeof body.status === "string") return body.status;
  throw unexpectedWriteResponse(action, body, effect);
}
