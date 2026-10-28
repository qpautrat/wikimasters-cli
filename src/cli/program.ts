import { Command, Option } from "commander";
import { createRequire } from "node:module";
import {
  AUCTION_LIMIT,
  CARD_SEARCH_FIELDS,
  NOTIFICATION_LIMIT,
  PAGE_LIMIT,
  PLAYER_SEARCH_LIMIT,
  acceptFriendRequest,
  acceptTrade,
  addToWishlist,
  asEntryId,
  asFriendshipId,
  asGuildId,
  asLabelId,
  asPlayerId,
  asTradeId,
  cancelAuction,
  cancelTrade,
  createAuction,
  createLabel,
  declineFriendRequest,
  deleteLabel,
  discardEntries,
  joinGuild,
  listAuctions,
  listCollection,
  listFriendships,
  listLabels,
  listNotifications,
  listRunningBids,
  listWishlist,
  loginInChrome,
  loginInFirefox,
  parseAuctionDuration,
  parseAuctionId,
  parseAuctionLimit,
  parseAuctionSearchPage,
  parseBidAmount,
  parseCardId,
  parseCardSearchField,
  parsePageLimit,
  parsePageNumber,
  parseStartingPrice,
  parseTradeCard,
  parseTradeWikibidous,
  placeBid,
  listTrades,
  proposeTrade,
  readCardValues,
  readMyProfile,
  readProfileCollection,
  removeFriendship,
  removeFromWishlist,
  searchAuctions,
  searchCards,
  searchGlobalCollection,
  searchPlayers,
  sendFriendRequest,
  showAuction,
  starEntry,
  tagEntry,
  unstarEntry,
  untagEntry,
  type AuctionFilter,
  type CollectionFilter,
} from "../core/index.js";
import { loadConfig } from "./config.js";
import {
  formatAddition,
  formatAuction,
  formatAuctionSearch,
  formatAuctions,
  formatBid,
  formatCancelledAuction,
  formatTrades,
  formatTradeStatus,
  formatCardSearch,
  formatCardValues,
  formatCollection,
  formatCreatedAuction,
  formatDiscard,
  formatEntryFavourite,
  formatEntryTag,
  formatEntryUntag,
  formatFriendRequest,
  formatFriendshipStatus,
  formatFriendships,
  formatGlobalCollection,
  formatGuildJoin,
  formatLabelCreation,
  formatLabelDeletion,
  formatLabels,
  formatLogin,
  formatMyProfile,
  formatNotifications,
  formatPlayerSearch,
  formatProfileCollection,
  formatProposedTrade,
  formatRemoval,
  formatRemovedFriendship,
  formatRunningBids,
  formatWishlist,
  type Format,
} from "./output.js";
import { readPastedRefreshToken } from "./pasted-session.js";
import { openSession } from "./session.js";

const { version } = createRequire(import.meta.url)("../../package.json") as {
  version: string;
};

export const program = new Command("wikimasters")
  .description("Interact with WikiMasters")
  .version(version)
  .option("--json", "print the result as JSON on stdout")
  .configureHelp({ showGlobalOptions: true });

const EXAMPLE_AUCTION_ID = "6f1c2d3e-4b5a-4c7d-8e9f-0a1b2c3d4e5f";
const EXAMPLE_CARD_ID = "9b2e4f6a-1c3d-4e5f-8a7b-2c4d6e8f0a1b";
const OTHER_EXAMPLE_CARD_ID = "0d4f6b8a-3e5c-4a7b-9c1d-5e7f9a1b3c5d";
const EXAMPLE_ENTRY_ID = "4a7c9e1b-6d2f-4b8a-9e3c-1f5a7b9d2e4c";
const OTHER_EXAMPLE_ENTRY_ID = "8e2d5a9c-3b7f-4c1e-a6d4-9f3b1e7c5a28";
const EXAMPLE_FRIENDSHIP_ID = "3e8b1d6f-9a2c-4f7e-b5d1-6c9a3f2e8b47";
const EXAMPLE_GUILD_ID = "2f9d4b7a-8c1e-4a3f-b6d2-5e8a1c4f7b93";
const EXAMPLE_LABEL_ID = "0b6c1f5e-2d8a-4f3e-9c41-7a2b9e8d1c34";
const EXAMPLE_PLAYER_ID = "5c8e2a4f-7b1d-4e9a-b3c6-2d4f6a8b0c1e";
const EXAMPLE_TRADE_ID = "7d3a9f1c-2e6b-4a8d-b5c7-3f1e9a2d6b84";

const PLAYER_ID_HELP =
  "the player's id, as given by player search or cards global";

function examples(...calls: string[]): string {
  return `\nExamples:\n${calls.map((call) => `  $ ${call}`).join("\n")}`;
}

function format(): Format {
  return program.opts<{ json?: boolean }>().json ? "json" : "text";
}

interface LoginOptions {
  firefox?: boolean;
  chrome?: boolean;
}

function readRefreshToken({ firefox, chrome }: LoginOptions): Promise<string> {
  if (firefox) {
    console.error(
      "Sign in to WikiMasters in the Firefox window that just opened; it closes once the session is found…",
    );
    return loginInFirefox();
  }
  if (chrome) {
    console.error(
      "Sign in to WikiMasters in the Chrome window that just opened; it closes once the session is found, up to 30 s after you sign in…",
    );
    return loginInChrome();
  }
  return readPastedRefreshToken();
}

program
  .command("login")
  .description(
    "Sign in by pasting the session of your browser and store it in $XDG_CONFIG_HOME/wikimasters-cli/.env, ~/.config/wikimasters-cli/.env by default",
  )
  .option(
    "--firefox",
    "sign in through a Firefox window the command opens instead, on macOS",
  )
  .addOption(
    new Option(
      "--chrome",
      "sign in through a Chrome window the command opens instead, on macOS",
    ).conflicts("firefox"),
  )
  .addHelpText(
    "after",
    examples(
      "wikimasters login",
      "wikimasters login --firefox",
      "wikimasters login --chrome",
    ),
  )
  .action(async (options: LoginOptions) => {
    loadConfig();
    const session = await openSession(await readRefreshToken(options));
    console.log(formatLogin(session.userId, format()));
  });

interface PageOptions {
  page: string;
  limit: string;
}

const auction = program.command("auction").description("Take part in auctions");

auction
  .command("bid")
  .description(
    "Bid an exact amount on an auction; the game accepts or refuses it and gives its reason",
  )
  .argument("<auction-id>", "auction UUID")
  .argument("<amount>", "wikibidous to bid, a strictly positive integer")
  .addHelpText(
    "after",
    examples(`wikimasters auction bid ${EXAMPLE_AUCTION_ID} 250`),
  )
  .action(async (rawAuctionId: string, rawAmount: string) => {
    const auctionId = parseAuctionId(rawAuctionId);
    const amount = parseBidAmount(rawAmount);
    const session = await openSession();
    console.log(
      formatBid(await placeBid(session, auctionId, amount), format()),
    );
  });

auction
  .command("bids")
  .description(
    "Read a page of your bids on running auctions, in the order the game returns them, each with its auction id, card title, amount, date, the current bid, whether you lead and the end time; says when the page is full",
  )
  .option("--page <p>", "page to read, a strictly positive integer", "1")
  .option(
    "--limit <n>",
    "number of bids per page, an integer sent to the game as given",
    String(PAGE_LIMIT),
  )
  .addHelpText(
    "after",
    examples("wikimasters auction bids", "wikimasters auction bids --page 2"),
  )
  .action(async ({ page, limit }: PageOptions) => {
    const request = {
      page: parsePageNumber(page),
      limit: parsePageLimit(limit),
    };
    const result = await listRunningBids(await openSession(), request);
    console.log(formatRunningBids(result, format()));
  });

auction
  .command("create")
  .description(
    "Put an entry of your collection up for auction at a starting price for a duration; the game accepts or refuses it and gives its reason",
  )
  .argument("<entry-id>", "entry id, as given by collection list")
  .argument("<starting-price>", "wikibidous the bidding starts at, an integer")
  .argument("<duration>", "minutes the auction lasts, an integer")
  .addHelpText(
    "after",
    examples(`wikimasters auction create ${EXAMPLE_ENTRY_ID} 50 60`),
  )
  .action(
    async (entryId: string, rawStartingPrice: string, rawDuration: string) => {
      const startingPrice = parseStartingPrice(rawStartingPrice);
      const duration = parseAuctionDuration(rawDuration);
      const session = await openSession();
      console.log(
        formatCreatedAuction(
          await createAuction(
            session,
            asEntryId(entryId),
            startingPrice,
            duration,
          ),
          format(),
        ),
      );
    },
  );

auction
  .command("cancel")
  .description(
    "Cancel one of your auctions so its card returns to your collection; the game accepts or refuses it and gives its reason",
  )
  .argument("<auction-id>", "auction UUID")
  .addHelpText(
    "after",
    examples(`wikimasters auction cancel ${EXAMPLE_AUCTION_ID}`),
  )
  .action(async (rawAuctionId: string) => {
    const auctionId = parseAuctionId(rawAuctionId);
    const session = await openSession();
    console.log(
      formatCancelledAuction(await cancelAuction(session, auctionId), format()),
    );
  });

auction
  .command("list")
  .description(
    "List auctions in the order the game returns them, with their card, status, end time, starting price, current bid, and whether you lead or sell them",
  )
  .option(
    "--status <status>",
    "list only the auctions of this status, e.g. active",
  )
  .option(
    "--limit <n>",
    "maximum number of auctions, a strictly positive integer",
    String(AUCTION_LIMIT),
  )
  .addHelpText(
    "after",
    examples("wikimasters auction list --status active --limit 10"),
  )
  .action(async ({ limit, ...filter }: AuctionFilter & { limit: string }) => {
    const maximum = parseAuctionLimit(limit);
    const auctions = await listAuctions(await openSession(), filter, maximum);
    console.log(formatAuctions(auctions, format(), filter.status));
  });

interface AuctionSearchOptions {
  limit: string;
  page: string;
}

auction
  .command("search")
  .description(
    "Find the auctions the game matches with the given text, in the order it returns them, with their card, status, end time, starting price, current bid, and whether you lead or sell them",
  )
  .argument(
    "<text...>",
    "text to search for, as in the marketplace search field",
  )
  .option(
    "--limit <n>",
    "maximum number of auctions, a strictly positive integer",
    String(AUCTION_LIMIT),
  )
  .option(
    "--page <p>",
    "page of results to read, a strictly positive integer",
    "1",
  )
  .addHelpText(
    "after",
    examples(
      "wikimasters auction search Half Dome --limit 5",
      "wikimasters auction search Half Dome --page 2",
    ),
  )
  .action(async (words: string[], { limit, page }: AuctionSearchOptions) => {
    const maximum = parseAuctionLimit(limit);
    const pageRead = parseAuctionSearchPage(page);
    const session = await openSession();
    const text = words.join(" ");
    const result = await searchAuctions(session, text, maximum, pageRead);
    console.log(formatAuctionSearch(result, format()));
  });

auction
  .command("show")
  .description(
    "Show an auction's card, status, end time, starting price, current bid, and whether you lead or sell it",
  )
  .argument("<auction-id>", "auction UUID")
  .addHelpText(
    "after",
    examples(`wikimasters auction show ${EXAMPLE_AUCTION_ID}`),
  )
  .action(async (rawAuctionId: string) => {
    const auctionId = parseAuctionId(rawAuctionId);
    const session = await openSession();
    console.log(formatAuction(await showAuction(session, auctionId), format()));
  });

const cards = program.command("cards").description("Browse the card catalogue");

cards
  .command("search")
  .description(
    "Find the cards of the catalogue whose title, category or summary contains the given text, regardless of case, at most 50, ordered by title",
  )
  .argument("<text...>", "text to search for, e.g. all or part of the title")
  .option(
    "--in <field>",
    `where to search the text: ${CARD_SEARCH_FIELDS.join(", ")}`,
    "title",
  )
  .addHelpText(
    "after",
    examples(
      "wikimasters cards search Half Dome",
      "wikimasters cards search Karmine --in summary",
    ),
  )
  .action(async (words: string[], { in: rawField }: { in: string }) => {
    const field = parseCardSearchField(rawField);
    const session = await openSession();
    const result = await searchCards(session, words.join(" "), field);
    console.log(formatCardSearch(result, format()));
  });

cards
  .command("value")
  .description(
    "Show the average sale price of each given card for each rarity it sold under, whether you own it or not; stops at the first card the game refuses",
  )
  .argument("<card-id...>", "card UUIDs")
  .addHelpText(
    "after",
    examples(
      `wikimasters cards value ${EXAMPLE_CARD_ID} ${OTHER_EXAMPLE_CARD_ID}`,
    ),
  )
  .action(async (rawCardIds: string[]) => {
    const cardIds = rawCardIds.map(parseCardId);
    const values = await readCardValues(await openSession(), cardIds);
    console.log(formatCardValues(values, format()));
  });

interface GlobalCollectionOptions {
  page?: string;
  sort?: string;
  rarity?: string[];
  wishlist?: boolean;
}

function repeated(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}

cards
  .command("global")
  .description(
    "Search the Global Collection page of the game, with or without text, and print one page of the cards it finds, whether you own or wish each one, and the friends who own it with their rarities",
  )
  .argument("[text]", "text the game searches in the card title and category")
  .option(
    "--page <n>",
    "page of results, sent to the game as given; the game counts pages from 0",
  )
  .option(
    "--sort <field>",
    "sort field, sent to the game as given; the page offers rarity, name, atk and def",
  )
  .option(
    "--rarity <code>",
    "keep this rarity, sent to the game as given, e.g. R; repeat it for several",
    repeated,
  )
  .option("--wishlist", "keep only the cards of your wishlist")
  .addHelpText(
    "after",
    examples(
      'wikimasters cards global "Mont Blanc"',
      "wikimasters cards global --wishlist",
      "wikimasters cards global Castaldi --rarity L --rarity UR --sort name --page 1",
    ),
  )
  .action(
    async (
      text: string | undefined,
      { page, sort, rarity, wishlist }: GlobalCollectionOptions,
    ) => {
      const session = await openSession();
      const result = await searchGlobalCollection(session, {
        text,
        page,
        sort,
        rarities: rarity,
        wishlist,
      });
      console.log(formatGlobalCollection(result, format()));
    },
  );

const collection = program
  .command("collection")
  .description("Manage your collection");

interface CollectionListOptions extends CollectionFilter, PageOptions {}

collection
  .command("list")
  .description(
    "Read a page of your collection, earliest obtained first, with each card's entry id, card id, owned rarity, copies, favourite and shiny state, labels and obtention date; says when the page is full",
  )
  .option(
    "--rarity <code>",
    "list only the cards of this owned rarity: C, PC, R, SR, UR or L",
  )
  .option("--page <p>", "page to read, a strictly positive integer", "1")
  .option(
    "--limit <n>",
    "number of cards per page, an integer sent to the game as given",
    String(PAGE_LIMIT),
  )
  .addHelpText(
    "after",
    examples(
      "wikimasters collection list --rarity C",
      "wikimasters collection list --page 2",
    ),
  )
  .action(async ({ page, limit, ...filter }: CollectionListOptions) => {
    const request = {
      page: parsePageNumber(page),
      limit: parsePageLimit(limit),
    };
    const result = await listCollection(await openSession(), request, filter);
    console.log(formatCollection(result, format(), filter.rarity));
  });

collection
  .command("discard")
  .description(
    "Discard the given entries of your collection for 1 wikibidou each, in a single request; exits 1 if the game refused some",
  )
  .argument("<entry-id...>", "entry ids, as given by collection list")
  .addHelpText(
    "after",
    examples(
      `wikimasters collection discard ${EXAMPLE_ENTRY_ID} ${OTHER_EXAMPLE_ENTRY_ID}`,
    ),
  )
  .action(async (entryIds: string[]) => {
    const result = await discardEntries(
      await openSession(),
      entryIds.map(asEntryId),
    );
    console.log(formatDiscard(result, format()));
    if (result.failed.length > 0) process.exitCode = 1;
  });

collection
  .command("star")
  .description("Mark an entry of your collection as favourite")
  .argument("<entry-id>", "entry id, as given by collection list")
  .addHelpText(
    "after",
    examples(`wikimasters collection star ${EXAMPLE_ENTRY_ID}`),
  )
  .action(async (entryId: string) => {
    const session = await openSession();
    console.log(
      formatEntryFavourite(
        await starEntry(session, asEntryId(entryId)),
        format(),
      ),
    );
  });

collection
  .command("unstar")
  .description("Remove an entry of your collection from the favourites")
  .argument("<entry-id>", "entry id, as given by collection list")
  .addHelpText(
    "after",
    examples(`wikimasters collection unstar ${EXAMPLE_ENTRY_ID}`),
  )
  .action(async (entryId: string) => {
    const session = await openSession();
    console.log(
      formatEntryFavourite(
        await unstarEntry(session, asEntryId(entryId)),
        format(),
      ),
    );
  });

collection
  .command("tag")
  .description("Put one of your labels on an entry of your collection")
  .argument("<entry-id>", "entry id, as given by collection list")
  .argument("<label-id>", "label id, as given by labels list")
  .addHelpText(
    "after",
    examples(
      `wikimasters collection tag ${EXAMPLE_ENTRY_ID} ${EXAMPLE_LABEL_ID}`,
    ),
  )
  .action(async (entryId: string, labelId: string) => {
    const session = await openSession();
    console.log(
      formatEntryTag(
        await tagEntry(session, asEntryId(entryId), asLabelId(labelId)),
        format(),
      ),
    );
  });

collection
  .command("untag")
  .description(
    "Remove one of your labels from an entry of your collection; succeeds if the entry does not have it",
  )
  .argument("<entry-id>", "entry id, as given by collection list")
  .argument("<label-id>", "label id, as given by labels list")
  .addHelpText(
    "after",
    examples(
      `wikimasters collection untag ${EXAMPLE_ENTRY_ID} ${EXAMPLE_LABEL_ID}`,
    ),
  )
  .action(async (entryId: string, labelId: string) => {
    const session = await openSession();
    console.log(
      formatEntryUntag(
        await untagEntry(session, asEntryId(entryId), asLabelId(labelId)),
        format(),
      ),
    );
  });

const friend = program.command("friend").description("Manage your friends");

friend
  .command("add")
  .description(
    "Send a friend request to the player of that id, in a single request, and print the request id and the status the game gives; the game accepts or refuses it and gives its reason",
  )
  .argument("<player-id>", PLAYER_ID_HELP)
  .addHelpText("after", examples(`wikimasters friend add ${EXAMPLE_PLAYER_ID}`))
  .action(async (playerId: string) => {
    const session = await openSession();
    console.log(
      formatFriendRequest(
        await sendFriendRequest(session, asPlayerId(playerId)),
        format(),
      ),
    );
  });

friend
  .command("list")
  .description(
    "List your friends and your pending friend requests, received and sent, in a single request and in the game's order, each with the friendship id, whether it is a friend, a received or a sent request, and the player's id and pseudo",
  )
  .addHelpText("after", examples("wikimasters friend list"))
  .action(async () => {
    console.log(
      formatFriendships(await listFriendships(await openSession()), format()),
    );
  });

friend
  .command("accept")
  .description(
    "Accept a friend request another player sent you, in a single request, and print the request id and the status the game gives; the game accepts or refuses it and gives its reason",
  )
  .argument(
    "<friendship-id>",
    "the request's friendship id, as given by friend list",
  )
  .addHelpText(
    "after",
    examples(`wikimasters friend accept ${EXAMPLE_FRIENDSHIP_ID}`),
  )
  .action(async (friendshipId: string) => {
    const session = await openSession();
    console.log(
      formatFriendshipStatus(
        await acceptFriendRequest(session, asFriendshipId(friendshipId)),
        format(),
      ),
    );
  });

friend
  .command("decline")
  .description(
    "Decline a friend request another player sent you, in a single request, and print the request id and the status the game gives; the game accepts or refuses it and gives its reason",
  )
  .argument(
    "<friendship-id>",
    "the request's friendship id, as given by friend list",
  )
  .addHelpText(
    "after",
    examples(`wikimasters friend decline ${EXAMPLE_FRIENDSHIP_ID}`),
  )
  .action(async (friendshipId: string) => {
    const session = await openSession();
    console.log(
      formatFriendshipStatus(
        await declineFriendRequest(session, asFriendshipId(friendshipId)),
        format(),
      ),
    );
  });

friend
  .command("remove")
  .description(
    "Remove a friend, or a friend request you sent, in a single request, and print the friendship id once the game reports success; the game accepts or refuses it and gives its reason",
  )
  .argument(
    "<friendship-id>",
    "the friendshipId of a friend or sent row of friend list",
  )
  .addHelpText(
    "after",
    examples(`wikimasters friend remove ${EXAMPLE_FRIENDSHIP_ID}`),
  )
  .action(async (friendshipId: string) => {
    const session = await openSession();
    console.log(
      formatRemovedFriendship(
        await removeFriendship(session, asFriendshipId(friendshipId)),
        format(),
      ),
    );
  });

const guild = program.command("guild").description("Manage your guild");

guild
  .command("join")
  .description(
    "Accept a guild's invitation to join it, in a single request, and print the guild id; the game accepts or refuses it and gives its reason",
  )
  .argument(
    "<guild-id>",
    "the guild's id, as given by the guild_id in the data of a guild_invite notification notifications list prints",
  )
  .addHelpText("after", examples(`wikimasters guild join ${EXAMPLE_GUILD_ID}`))
  .action(async (guildId: string) => {
    const session = await openSession();
    console.log(
      formatGuildJoin(await joinGuild(session, asGuildId(guildId)), format()),
    );
  });

const labels = program.command("labels").description("Manage your labels");

labels
  .command("list")
  .description("List your labels, ordered by name, with their id and colour")
  .addHelpText("after", examples("wikimasters labels list"))
  .action(async () => {
    console.log(formatLabels(await listLabels(await openSession()), format()));
  });

labels
  .command("create")
  .description("Create a label and show its id, name and colour")
  .argument("<name>", "label name")
  .option("--color <colour>", "label colour, sent to the game as given")
  .addHelpText(
    "after",
    examples('wikimasters labels create "Karmine Corp" --color "#1e40af"'),
  )
  .action(async (name: string, { color }: { color?: string }) => {
    const session = await openSession();
    console.log(
      formatLabelCreation(await createLabel(session, name, color), format()),
    );
  });

labels
  .command("delete")
  .description("Delete one of your labels, removing it from your cards")
  .argument("<label-id>", "label id, as given by labels list")
  .addHelpText(
    "after",
    examples(`wikimasters labels delete ${EXAMPLE_LABEL_ID}`),
  )
  .action(async (labelId: string) => {
    const session = await openSession();
    console.log(
      formatLabelDeletion(
        await deleteLabel(session, asLabelId(labelId)),
        format(),
      ),
    );
  });

const notifications = program
  .command("notifications")
  .description("Read the notifications the game sent you");

interface NotificationOptions extends PageOptions {
  type: string[];
  unread?: boolean;
  after?: string;
}

notifications
  .command("list")
  .description(
    "Read a page of your notifications, most recent first, each with its date, type, whether it is unread, message and the other data the game attaches to it, such as the auction, card, player or trade concerned; says when the page is full",
  )
  .option(
    "--type <type>",
    "keep this type, sent as given, e.g. marketplace_wishlist_listed, marketplace_outbid, marketplace_auction_won, marketplace_auction_sold, marketplace_auction_unsold, friend_request, trade_offer or trade_accepted; repeat to keep several",
    repeated,
    [],
  )
  .option("--unread", "keep only the notifications you have not read")
  .option(
    "--after <date>",
    "keep the notifications received strictly after this date, sent as given, e.g. 2026-10-16T13:31:00.222902+00:00",
  )
  .option("--page <p>", "page to read, a strictly positive integer", "1")
  .option(
    "--limit <n>",
    "number of notifications per page, an integer sent to the game as given",
    String(NOTIFICATION_LIMIT),
  )
  .addHelpText(
    "after",
    examples(
      "wikimasters notifications list",
      "wikimasters notifications list --type marketplace_wishlist_listed --after 2026-10-16T13:31:00.222902+00:00",
      "wikimasters notifications list --type marketplace_outbid --type marketplace_auction_won --unread",
      "wikimasters notifications list --limit 10 --page 2",
    ),
  )
  .action(async ({ type, page, limit, ...filter }: NotificationOptions) => {
    const request = {
      page: parsePageNumber(page),
      limit: parsePageLimit(limit),
    };
    const result = await listNotifications(
      await openSession(),
      { types: type, ...filter },
      request,
    );
    console.log(formatNotifications(result, format()));
  });

const player = program.command("player").description("Find players");

player
  .command("search")
  .description(
    `Search the players whose pseudo contains the text, regardless of case, and print each one's id and pseudo; the game returns at most ${PLAYER_SEARCH_LIMIT} players, and none for a text shorter than 2 characters`,
  )
  .argument("<text>", "all or part of a pseudo, sent to the game as given")
  .addHelpText("after", examples("wikimasters player search luc"))
  .action(async (text: string) => {
    console.log(
      formatPlayerSearch(
        await searchPlayers(await openSession(), text),
        format(),
      ),
    );
  });

const profile = program
  .command("profile")
  .description("Look at players' profiles");

profile
  .command("me")
  .description(
    "Show every field of your profile as the game returns it, such as wikibidous_balance",
  )
  .addHelpText("after", examples("wikimasters profile me"))
  .action(async () => {
    console.log(
      formatMyProfile(await readMyProfile(await openSession()), format()),
    );
  });

interface ProfileCollectionOptions {
  page: string;
  sort?: string;
  search?: string;
  rarity: string[];
  wishlisted?: boolean;
}

profile
  .command("collection")
  .description(
    "Read a page of a player's collection, at most 50 entries, in the game's order, with each entry's id, card id, title, owned rarity, copies, favourite and shiny state, labels and whether a pending trade holds the card",
  )
  .argument("<pseudo>", "the player's pseudo, as the game shows it")
  .option(
    "--page <n>",
    "page to read, sent to the game as given; the game numbers pages from 0",
    "0",
  )
  .option(
    "--sort <field>",
    "order sent to the game as given, e.g. rarity, name or added",
  )
  .option("--search <text>", "text the game searches for, sent as given")
  .option(
    "--rarity <code>",
    "keep this owned rarity, sent as given, e.g. SR; repeat to keep several",
    repeated,
    [],
  )
  .option("--wishlisted", "keep only the cards of your wishlist")
  .addHelpText(
    "after",
    examples(
      "wikimasters profile collection LucasPerso",
      "wikimasters profile collection LucasPerso --rarity UR --rarity L --page 1",
      "wikimasters profile collection LucasPerso --sort name",
      'wikimasters profile collection LucasPerso --search "Half Dome" --wishlisted',
    ),
  )
  .action(
    async (pseudo: string, { rarity, ...query }: ProfileCollectionOptions) => {
      const session = await openSession();
      const result = await readProfileCollection(session, pseudo, {
        ...query,
        rarities: rarity,
      });
      console.log(formatProfileCollection(result, format()));
    },
  );

const trade = program.command("trade").description("Trade with players");

interface TradeProposeOptions {
  give: string[];
  take: string[];
  giveWikibidous: string;
  takeWikibidous: string;
  counter?: string;
}

trade
  .command("propose")
  .description(
    "Propose a trade of cards and wikibidous to a player, in a single request, and print the trade id; the game accepts or refuses it and gives its reason",
  )
  .argument("<player-id>", PLAYER_ID_HELP)
  .option(
    "--give <entry-id:card-id>",
    "an entry of your collection and its card, as given by collection list; repeat to give several",
    repeated,
    [],
  )
  .option(
    "--take <entry-id:card-id>",
    "an entry of the player's collection and its card, as given by profile collection; repeat to take several",
    repeated,
    [],
  )
  .option("--give-wikibidous <n>", "wikibidous you give, an integer", "0")
  .option("--take-wikibidous <n>", "wikibidous you ask for, an integer", "0")
  .option(
    "--counter <trade-id>",
    "send the proposal as a counter-offer to this trade",
  )
  .addHelpText(
    "after",
    examples(
      `wikimasters trade propose ${EXAMPLE_PLAYER_ID} --give ${EXAMPLE_ENTRY_ID}:${EXAMPLE_CARD_ID} --take ${OTHER_EXAMPLE_ENTRY_ID}:${OTHER_EXAMPLE_CARD_ID}`,
      `wikimasters trade propose ${EXAMPLE_PLAYER_ID} --take ${OTHER_EXAMPLE_ENTRY_ID}:${OTHER_EXAMPLE_CARD_ID} --give-wikibidous 50`,
      `wikimasters trade propose ${EXAMPLE_PLAYER_ID} --give ${EXAMPLE_ENTRY_ID}:${EXAMPLE_CARD_ID} --take-wikibidous 20 --counter ${EXAMPLE_TRADE_ID}`,
    ),
  )
  .action(async (playerId: string, options: TradeProposeOptions) => {
    const proposal = {
      recipientId: asPlayerId(playerId),
      give: options.give.map(parseTradeCard),
      take: options.take.map(parseTradeCard),
      giveWikibidous: parseTradeWikibidous(options.giveWikibidous),
      takeWikibidous: parseTradeWikibidous(options.takeWikibidous),
      ...(options.counter === undefined
        ? {}
        : { counterTo: asTradeId(options.counter) }),
    };
    const session = await openSession();
    console.log(
      formatProposedTrade(await proposeTrade(session, proposal), format()),
    );
  });

trade
  .command("list")
  .description(
    "List the trades you proposed and those proposed to you, in a single request and in the game's order, each with its id, status, date, the player who proposes it and the one who receives it, the trade it answers if any, and for each player the cards given, with entry id, card id and title, and the wikibidous given",
  )
  .addHelpText("after", examples("wikimasters trade list"))
  .action(async () => {
    console.log(formatTrades(await listTrades(await openSession()), format()));
  });

trade
  .command("cancel")
  .description(
    "Cancel a trade you proposed, in a single request, and print the trade id and the status the game gives; the game accepts or refuses it and gives its reason",
  )
  .argument(
    "<trade-id>",
    "the trade's id, as given by trade propose or the trade_id of a notification",
  )
  .addHelpText(
    "after",
    examples(`wikimasters trade cancel ${EXAMPLE_TRADE_ID}`),
  )
  .action(async (rawTradeId: string) => {
    const tradeId = asTradeId(rawTradeId);
    const session = await openSession();
    console.log(
      formatTradeStatus(await cancelTrade(session, tradeId), format()),
    );
  });

trade
  .command("accept")
  .description(
    "Accept a trade another player proposed to you, in a single request, and print the trade id and the status the game gives; the game accepts or refuses it and gives its reason",
  )
  .argument(
    "<trade-id>",
    "the trade's id, as given by the trade_id of a notification",
  )
  .addHelpText(
    "after",
    examples(`wikimasters trade accept ${EXAMPLE_TRADE_ID}`),
  )
  .action(async (rawTradeId: string) => {
    const tradeId = asTradeId(rawTradeId);
    const session = await openSession();
    console.log(
      formatTradeStatus(await acceptTrade(session, tradeId), format()),
    );
  });

const wishlist = program
  .command("wishlist")
  .description("Manage your wishlist");

wishlist
  .command("list")
  .description(
    "List the cards of your wishlist, most recently added first, marking those already in your collection",
  )
  .addHelpText("after", examples("wikimasters wishlist list"))
  .action(async () => {
    console.log(
      formatWishlist(await listWishlist(await openSession()), format()),
    );
  });

wishlist
  .command("add")
  .description(
    "Add a card of the catalogue to your wishlist; succeeds if the card is already there",
  )
  .argument("<card-id>", "card UUID")
  .addHelpText("after", examples(`wikimasters wishlist add ${EXAMPLE_CARD_ID}`))
  .action(async (rawCardId: string) => {
    const cardId = parseCardId(rawCardId);
    const session = await openSession();
    console.log(formatAddition(await addToWishlist(session, cardId), format()));
  });

wishlist
  .command("remove")
  .description(
    "Remove a card from your wishlist; succeeds if the card is already absent",
  )
  .argument("<card-id>", "card UUID")
  .addHelpText(
    "after",
    examples(`wikimasters wishlist remove ${EXAMPLE_CARD_ID}`),
  )
  .action(async (rawCardId: string) => {
    const cardId = parseCardId(rawCardId);
    const session = await openSession();
    console.log(
      formatRemoval(await removeFromWishlist(session, cardId), format()),
    );
  });
