export type GuildId = string & { readonly __brand: "GuildId" };

export function asGuildId(raw: string): GuildId {
  return raw as GuildId;
}
