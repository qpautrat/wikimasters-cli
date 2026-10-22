import type { FriendshipId } from "./friendship-id.js";
import type { FriendshipStatus } from "./friendship-status.js";
import { FRIENDS_PAGE } from "./friends-page.js";
import { returnedStatus } from "./returned-status.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

const ANSWERS = {
  accept: { verb: "Accepting", effect: "accepted" },
  decline: { verb: "Declining", effect: "declined" },
} as const;

async function answerFriendRequest(
  session: Session,
  friendshipId: FriendshipId,
  answer: keyof typeof ANSWERS,
): Promise<FriendshipStatus> {
  const { verb, effect } = ANSWERS[answer];
  const action = `${verb} friend request ${friendshipId}`;
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    FRIENDS_PAGE,
    `/api/friends/${friendshipId}`,
    { method: "PATCH", body: { action: answer } },
  );
  return { friendshipId, status: returnedStatus(action, body, effect) };
}

export function acceptFriendRequest(
  session: Session,
  friendshipId: FriendshipId,
): Promise<FriendshipStatus> {
  return answerFriendRequest(session, friendshipId, "accept");
}

export function declineFriendRequest(
  session: Session,
  friendshipId: FriendshipId,
): Promise<FriendshipStatus> {
  return answerFriendRequest(session, friendshipId, "decline");
}
