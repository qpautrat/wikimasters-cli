import type { FriendshipId } from "./friendship-id.js";
import type { FriendshipStatus } from "./friendship-status.js";
import { FRIENDS_PAGE } from "./friends-page.js";
import { returnedStatus } from "./returned-status.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export async function acceptFriendRequest(
  session: Session,
  friendshipId: FriendshipId,
): Promise<FriendshipStatus> {
  const action = `Accepting friend request ${friendshipId}`;
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    FRIENDS_PAGE,
    `/api/friends/${friendshipId}`,
    { method: "PATCH", body: { action: "accept" } },
  );
  return { friendshipId, status: returnedStatus(action, body, "accepted") };
}
