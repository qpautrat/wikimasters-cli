import { WikiMastersError } from "./errors.js";
import type { GuildId } from "./guild-id.js";
import { isObject } from "./object.js";
import type { Session } from "./session.js";
import { siteCookie, siteRequest } from "./site.js";

const GUILD_PAGE = "/guild";

export interface GuildJoin {
  guildId: GuildId;
  ok: true;
}

export async function joinGuild(
  session: Session,
  guildId: GuildId,
): Promise<GuildJoin> {
  const action = `Joining guild ${guildId}`;
  const body = await siteRequest(
    session,
    await siteCookie(session),
    action,
    GUILD_PAGE,
    "/api/guilds/join",
    { method: "POST", body: { guild_id: guildId } },
  );
  if (!isObject(body) || body.ok !== true) {
    throw new WikiMastersError(
      `${action} returned an unexpected response, which may have joined it: ${JSON.stringify(body)}`,
    );
  }
  return { guildId, ok: true };
}
