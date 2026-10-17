import { WikiMastersError, apiFailure } from "./errors.js";
import { isObject } from "./object.js";
import type { Session } from "./session.js";

export type MyProfile = Record<string, unknown>;

export async function readMyProfile(session: Session): Promise<MyProfile> {
  const action = "Reading your profile";
  const { data, error, status } = await session.client.rpc("get_my_profile");
  if (error) throw apiFailure(action, status, error.message);
  if (!isObject(data)) {
    throw new WikiMastersError(
      `${action} returned an unexpected response: ${JSON.stringify(data)}`,
    );
  }
  return data;
}
