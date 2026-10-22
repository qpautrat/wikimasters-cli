import { WikiMastersError } from "./errors.js";
import type { FriendshipId } from "./friendship-id.js";
import { FRIENDS_PAGE } from "./friends-page.js";
import { isObject } from "./object.js";
import type { PlayerId } from "./player-id.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export type FriendshipKind = "friend" | "received" | "sent";

export interface Friendship {
  friendshipId: FriendshipId;
  kind: FriendshipKind;
  playerId: PlayerId;
  username: string;
}

interface FriendshipPlayer {
  id: PlayerId;
  username: string;
}

interface FriendshipRow {
  id: FriendshipId;
  status: string;
  requester_id: string;
  addressee_id: string;
  requester: FriendshipPlayer;
  addressee: FriendshipPlayer;
}

function isFriendshipPlayer(value: unknown): value is FriendshipPlayer {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.username === "string"
  );
}

function isFriendshipRow(value: unknown): value is FriendshipRow {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.status === "string" &&
    typeof value.requester_id === "string" &&
    typeof value.addressee_id === "string" &&
    isFriendshipPlayer(value.requester) &&
    isFriendshipPlayer(value.addressee)
  );
}

function kindOf(status: string, sentByMe: boolean): FriendshipKind | undefined {
  if (status === "accepted") return "friend";
  if (status !== "pending") return undefined;
  return sentByMe ? "sent" : "received";
}

function toFriendship(
  row: FriendshipRow,
  userId: string,
): Friendship | undefined {
  const sentByMe = row.requester_id === userId;
  if (!sentByMe && row.addressee_id !== userId) return undefined;
  const kind = kindOf(row.status, sentByMe);
  if (kind === undefined) return undefined;
  const { id, username } = sentByMe ? row.addressee : row.requester;
  return { friendshipId: row.id, kind, playerId: id, username };
}

export async function listFriendships(session: Session): Promise<Friendship[]> {
  const action = "Reading your friends and pending friend requests";
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    FRIENDS_PAGE,
    "/api/friends",
    { method: "GET" },
  );
  const unexpectedResponse = () =>
    new WikiMastersError(
      `${action} returned an unexpected response: ${JSON.stringify(body)}`,
    );
  if (
    !isObject(body) ||
    !Array.isArray(body.friendships) ||
    !body.friendships.every(isFriendshipRow)
  ) {
    throw unexpectedResponse();
  }
  return body.friendships.map((row) => {
    const friendship = toFriendship(row, session.userId);
    if (friendship === undefined) throw unexpectedResponse();
    return friendship;
  });
}
