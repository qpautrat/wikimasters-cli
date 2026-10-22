import { unexpectedWriteResponse } from "./errors.js";
import type { FriendshipId } from "./friendship-id.js";
import { FRIENDS_PAGE } from "./friends-page.js";
import { isObject } from "./object.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export interface RemovedFriendship {
  friendshipId: FriendshipId;
  success: true;
}

export async function removeFriendship(
  session: Session,
  friendshipId: FriendshipId,
): Promise<RemovedFriendship> {
  const action = `Removing friendship ${friendshipId}`;
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    FRIENDS_PAGE,
    `/api/friends/${friendshipId}`,
    { method: "DELETE" },
  );
  if (!isObject(body) || body.success !== true) {
    throw unexpectedWriteResponse(action, body, "removed");
  }
  return { friendshipId, success: true };
}
