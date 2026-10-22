export type FriendshipId = string & { readonly __brand: "FriendshipId" };

export function asFriendshipId(raw: string): FriendshipId {
  return raw as FriendshipId;
}
