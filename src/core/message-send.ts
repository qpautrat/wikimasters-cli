import { unexpectedWriteResponse } from "./errors.js";
import { FRIENDS_PAGE } from "./friends-page.js";
import { asMessageId, type MessageId } from "./message-id.js";
import { isObject } from "./object.js";
import type { PlayerId } from "./player-id.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

export interface SentMessage {
  messageId: MessageId;
}

export async function sendMessage(
  session: Session,
  playerId: PlayerId,
  content: string,
): Promise<SentMessage> {
  const action = `Sending a message to player ${playerId}`;
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    FRIENDS_PAGE,
    `/api/chat/${playerId}`,
    { method: "POST", body: { content } },
  );
  if (
    isObject(body) &&
    isObject(body.message) &&
    typeof body.message.id === "string"
  ) {
    return { messageId: asMessageId(body.message.id) };
  }
  throw unexpectedWriteResponse(action, body, "sent");
}
