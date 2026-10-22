import { WikiMastersError } from "./errors.js";
import { FRIENDS_PAGE } from "./friends-page.js";
import { isFullPage } from "./page.js";
import type { PlayerId } from "./player-id.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export const PLAYER_SEARCH_LIMIT = 10;

export interface FoundPlayer {
  id: PlayerId;
  username: string;
}

export interface PlayerSearch {
  users: FoundPlayer[];
  full: boolean;
}

interface PlayerSearchResponse {
  users: FoundPlayer[];
}

function isPlayerSearchResponse(body: unknown): body is PlayerSearchResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "users" in body &&
    Array.isArray(body.users)
  );
}

export async function searchPlayers(
  session: Session,
  text: string,
): Promise<PlayerSearch> {
  const action = `Searching the players matching ${JSON.stringify(text)}`;
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    FRIENDS_PAGE,
    `/api/friends/search?${new URLSearchParams({ q: text })}`,
    { method: "GET" },
  );
  if (!isPlayerSearchResponse(body)) {
    throw new WikiMastersError(
      `${action} returned an unexpected response: ${JSON.stringify(body)}`,
    );
  }
  return {
    users: body.users.map(({ id, username }) => ({ id, username })),
    full: isFullPage(body.users, PLAYER_SEARCH_LIMIT),
  };
}
