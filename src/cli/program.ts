import { Command } from "commander";
import {
  AUCTION_LIMIT,
  CARD_SEARCH_FIELDS,
  PAGE_LIMIT,
  addToWishlist,
  cancelAuction,
  createAuction,
  createLabel,
  deleteLabel,
  discardCards,
  listAuctions,
  listCollection,
  listLabels,
  listRunningBids,
  listWishlist,
  loginInBrowser,
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
  placeBid,
  readCardValues,
  readProfileCollection,
  removeFromWishlist,
  searchAuctions,
  searchCards,
  searchGlobalCollection,
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
  formatCardSearch,
  formatCardValues,
  formatCollection,
  formatCreatedAuction,
  formatDiscard,
  formatEntryFavourite,
  formatEntryTag,
  formatEntryUntag,
  formatGlobalCollection,
  formatLabelCreation,
  formatLabelDeletion,
  formatLabels,
  formatLogin,
  formatProfileCollection,
  formatRemoval,
  formatRunningBids,
  formatWishlist,
  type Format,
} from "./output.js";
import { readPastedRefreshToken } from "./pasted-session.js";
import { openSession } from "./session.js";

export const program = new Command("wikimasters")
  .description("Interact with WikiMasters")
  .option("--json", "print the result as JSON on stdout")
  .configureHelp({ showGlobalOptions: true });

const EXAMPLE_AUCTION_ID = "6f1c2d3e-4b5a-4c7d-8e9f-0a1b2c3d4e5f";
const EXAMPLE_CARD_ID = "9b2e4f6a-1c3d-4e5f-8a7b-2c4d6e8f0a1b";
const OTHER_EXAMPLE_CARD_ID = "0d4f6b8a-3e5c-4a7b-9c1d-5e7f9a1b3c5d";
const EXAMPLE_ENTRY_ID = "4a7c9e1b-6d2f-4b8a-9e3c-1f5a7b9d2e4c";
const EXAMPLE_LABEL_ID = "0b6c1f5e-2d8a-4f3e-9c41-7a2b9e8d1c34";

function examples(...calls: string[]): string {
  return `\nExamples:\n${calls.map((call) => `  $ ${call}`).join("\n")}`;
}

function format(): Format {
  return program.opts<{ json?: boolean }>().json ? "json" : "text";
}

function loginInFirefox(): Promise<string> {
  console.error(
    "Sign in to WikiMasters in the Firefox window that just opened; it closes once the session is found…",
  );
  return loginInBrowser();
}

program
  .command("login")
  .description(
    "Sign in by pasting the session of your browser and store it in .env",
  )
  .option(
    "--firefox",
    "sign in through a Firefox window the command opens instead, on macOS",
  )
  .addHelpText(
    "after",
    examples("wikimasters login", "wikimasters login --firefox"),
  )
  .action(async ({ firefox }: { firefox?: boolean }) => {
    loadConfig();
    const session = await openSession(
      firefox ? await loginInFirefox() : await readPastedRefreshToken(),
    );
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
    "number of bids per page, a strictly positive integer",
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
  .argument(
    "<starting-price>",
    "wikibidous the bidding starts at, a strictly positive integer",
  )
  .argument(
    "<duration>",
    "minutes the auction lasts, a strictly positive integer",
  )
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
          await createAuction(session, entryId, startingPrice, duration),
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
    "number of cards per page, a strictly positive integer",
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
    "Discard the given cards of your collection for 1 wikibidou each; refuses them all if one is not in your collection, exits 1 if the game refused some",
  )
  .argument("<card-id...>", "card UUIDs")
  .addHelpText(
    "after",
    examples(
      `wikimasters collection discard ${EXAMPLE_CARD_ID} ${OTHER_EXAMPLE_CARD_ID}`,
    ),
  )
  .action(async (rawCardIds: string[]) => {
    const cardIds = rawCardIds.map(parseCardId);
    const result = await discardCards(await openSession(), cardIds);
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
      formatEntryFavourite(await starEntry(session, entryId), format()),
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
      formatEntryFavourite(await unstarEntry(session, entryId), format()),
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
      formatEntryTag(await tagEntry(session, entryId, labelId), format()),
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
      formatEntryUntag(await untagEntry(session, entryId, labelId), format()),
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
      formatLabelDeletion(await deleteLabel(session, labelId), format()),
    );
  });

const profile = program
  .command("profile")
  .description("Look at other players' profiles");

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
