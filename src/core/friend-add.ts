import { unexpectedWriteResponse } from "./errors.js";
import type { FriendshipId } from "./friendship-id.js";
import { FRIENDS_PAGE } from "./friends-page.js";
import { isObject } from "./object.js";
import type { PlayerId } from "./player-id.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export type FriendRequest = Record<string, unknown> & {
  id: FriendshipId;
  status: string;
};

function isFriendRequest(value: unknown): value is FriendRequest {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.status === "string"
  );
}

export async function sendFriendRequest(
  session: Session,
  playerId: PlayerId,
): Promise<FriendRequest> {
  const action = `Sending a friend request to player ${playerId}`;
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    FRIENDS_PAGE,
    "/api/friends",
    { method: "POST", body: { addressee_id: playerId } },
  );
  if (!isObject(body) || !isFriendRequest(body.friendship)) {
    throw unexpectedWriteResponse(action, body, "sent");
  }
  return body.friendship;
}
