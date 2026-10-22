import type { FriendshipId } from "./friendship-id.js";

export interface FriendshipStatus {
  friendshipId: FriendshipId;
  status: string;
}
