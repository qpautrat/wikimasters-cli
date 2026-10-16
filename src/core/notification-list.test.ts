import { describe, expect, it } from "vitest";
import { AuthRequiredError, WikiMastersError } from "./errors.js";
import {
  NOTIFICATION_LIMIT,
  listNotifications,
  type NotificationFilter,
} from "./notification-list.js";
import { parsePageLimit, parsePageNumber } from "./page.js";
import { resumeSession } from "./session.js";
import {
  USER_ID,
  fakeFetch,
  pagedRestRead,
  restRequest,
  restRoute,
  tokenRefresh,
  type Route,
} from "./testing/fake-supabase.js";

const CREATED = "2026-10-16T13:31:00.222902+00:00";
const NOTIFICATION_ID = "0363a628-f2a1-46dc-ac7b-ab0c2d301486";
const WISHLIST_LISTED = {
  title: "Carte de votre liste de souhaits",
  card_id: "674c1d3f-8c24-4ea1-a897-ec0a5004e652",
  message: "Caliste (esport) vient d'être mise en vente sur le marché.",
  auction_id: "3bb1dff2-ddc4-4746-99d3-1a4738101415",
  card_title: "Caliste (esport)",
};

const anyNotification: NotificationFilter = { types: [] };
const firstPage = {
  page: parsePageNumber("1"),
  limit: parsePageLimit(String(NOTIFICATION_LIMIT)),
};

function notification(overrides: Record<string, unknown> = {}) {
  return {
    id: NOTIFICATION_ID,
    type: "marketplace_wishlist_listed",
    read: false,
    created_at: CREATED,
    data: WISHLIST_LISTED,
    ...overrides,
  };
}

async function sessionWith(...routes: Route[]) {
  const { fetch, requests } = fakeFetch(tokenRefresh, ...routes);
  const session = await resumeSession({
    anonKey: "anon-key",
    refreshToken: "stored-token",
    fetch,
  });
  const reads = () => requests.filter(restRequest("GET", "notifications"));
  return { session, reads };
}

describe("listNotifications", () => {
  it("reads the user's notifications, most recent first, unfiltered by default", async () => {
    const { session, reads } = await sessionWith(
      pagedRestRead("notifications", []),
    );

    await listNotifications(session, anyNotification, firstPage);

    const params = reads()[0]?.url.searchParams;
    expect(params?.get("select")).toBe("id,type,read,created_at,data");
    expect(params?.get("user_id")).toBe(`eq.${USER_ID}`);
    expect(params?.get("order")).toBe("created_at.desc,id.desc");
    expect(params?.has("type")).toBe(false);
    expect(params?.has("read")).toBe(false);
    expect(params?.has("created_at")).toBe(false);
  });

  it("sends the types, the unread filter and the date as given", async () => {
    const { session, reads } = await sessionWith(
      pagedRestRead("notifications", []),
    );

    await listNotifications(
      session,
      {
        types: ["marketplace_wishlist_listed", "marketplace_outbid"],
        unread: true,
        after: "2026-10-16",
      },
      firstPage,
    );

    const params = reads()[0]?.url.searchParams;
    expect(params?.get("type")).toBe(
      "in.(marketplace_wishlist_listed,marketplace_outbid)",
    );
    expect(params?.get("read")).toBe("eq.false");
    expect(params?.get("created_at")).toBe("gt.2026-10-16");
  });

  it("gives each notification with its data as the game returns them", async () => {
    const { session } = await sessionWith(
      pagedRestRead("notifications", [
        notification(),
        notification({
          id: "6f3315e7-cd60-45b1-97fc-9161e7da2d03",
          type: "friend_request",
          read: true,
          data: { title: "Demande d'ami", requester_username: "LucasPerso" },
        }),
      ]),
    );

    const { notifications } = await listNotifications(
      session,
      anyNotification,
      firstPage,
    );

    expect(notifications).toEqual([
      {
        id: NOTIFICATION_ID,
        type: "marketplace_wishlist_listed",
        read: false,
        createdAt: CREATED,
        data: WISHLIST_LISTED,
      },
      expect.objectContaining({
        type: "friend_request",
        read: true,
        data: { title: "Demande d'ami", requester_username: "LucasPerso" },
      }),
    ]);
  });

  it("reads the requested page in a single request", async () => {
    const rows = Array.from({ length: 7 }, (_, index) =>
      notification({ id: String(index) }),
    );
    const { session, reads } = await sessionWith(
      pagedRestRead("notifications", rows),
    );

    const { notifications } = await listNotifications(
      session,
      anyNotification,
      { page: parsePageNumber("2"), limit: parsePageLimit("3") },
    );

    expect(notifications.map(({ id }) => id)).toEqual(["3", "4", "5"]);
    expect(reads()).toHaveLength(1);
    expect(reads()[0]?.url.searchParams.get("offset")).toBe("3");
    expect(reads()[0]?.url.searchParams.get("limit")).toBe("3");
  });

  it("says whether the page holds as many notifications as requested", async () => {
    const { session } = await sessionWith(
      pagedRestRead("notifications", [notification(), notification()]),
    );

    const twoPerPage = { page: firstPage.page, limit: parsePageLimit("2") };
    const threePerPage = { ...twoPerPage, limit: parsePageLimit("3") };
    await expect(
      listNotifications(session, anyNotification, twoPerPage),
    ).resolves.toMatchObject({ full: true });
    await expect(
      listNotifications(session, anyNotification, threePerPage),
    ).resolves.toMatchObject({ full: false });
  });

  it("returns an empty page when no notification matches", async () => {
    const { session } = await sessionWith(pagedRestRead("notifications", []));

    await expect(
      listNotifications(session, anyNotification, firstPage),
    ).resolves.toEqual({ notifications: [], full: false });
  });

  it("fails with the game's reason when it refuses the date", async () => {
    const { session } = await sessionWith(
      restRoute("GET", "notifications", {
        status: 400,
        body: {
          message:
            'invalid input syntax for type timestamp with time zone: "yesterday-ish"',
        },
      }),
    );

    const listing = listNotifications(
      session,
      { ...anyNotification, after: "yesterday-ish" },
      firstPage,
    );
    await expect(listing).rejects.toThrow(WikiMastersError);
    await expect(listing).rejects.toThrow(
      'invalid input syntax for type timestamp with time zone: "yesterday-ish"',
    );
  });

  it("asks to log in again on HTTP 401", async () => {
    const { session } = await sessionWith(
      restRoute("GET", "notifications", {
        status: 401,
        body: { message: "JWT expired" },
      }),
    );

    await expect(
      listNotifications(session, anyNotification, firstPage),
    ).rejects.toThrow(AuthRequiredError);
  });
});
