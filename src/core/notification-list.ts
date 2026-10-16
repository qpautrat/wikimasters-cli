import { apiFailure } from "./errors.js";
import { isFullPage, pageRange, type PageRequest } from "./page.js";
import type { Session } from "./session.js";

export const NOTIFICATION_LIMIT = 50;

export interface NotificationFilter {
  types: readonly string[];
  unread?: boolean;
  after?: string;
}

export interface Notification {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  data: Record<string, unknown>;
}

export interface NotificationPage {
  notifications: Notification[];
  full: boolean;
}

interface NotificationRow {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  data: Record<string, unknown>;
}

export async function listNotifications(
  session: Session,
  { types, unread, after }: NotificationFilter,
  request: PageRequest,
): Promise<NotificationPage> {
  const [from, to] = pageRange(request);
  let query = session.client
    .from("notifications")
    .select("id, type, read, created_at, data")
    .eq("user_id", session.userId);
  if (types.length > 0) query = query.in("type", types);
  if (unread) query = query.eq("read", false);
  if (after !== undefined) query = query.gt("created_at", after);
  const { data, error, status } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to)
    .overrideTypes<NotificationRow[], { merge: false }>();
  if (error) {
    throw apiFailure("Listing your notifications", status, error.message);
  }

  return {
    notifications: data.map(({ created_at, ...notification }) => ({
      ...notification,
      createdAt: created_at,
    })),
    full: isFullPage(data, request.limit),
  };
}
