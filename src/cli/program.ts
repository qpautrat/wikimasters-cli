import { Command } from "commander";
import {
  AUCTION_LIMIT,
  CARD_SEARCH_FIELDS,
  addToWishlist,
  createLabel,
  deleteLabel,
  discardCards,
  listAuctions,
  listCollection,
  listRunningBids,
  listWishlist,
  loginInBrowser,
  parseAuctionId,
  parseAuctionLimit,
  parseAuctionSearchPage,
  parseBidAmount,
  parseCardId,
  parseCardSearchField,
  placeBid,
  removeFromWishlist,
  searchAuctions,
  searchCards,
  showAuction,
  starCard,
  tagCard,
  unstarCard,
  untagCard,
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
  formatCardSearch,
  formatCollection,
  formatDiscard,
  formatFavourite,
  formatLabelCreation,
  formatLabelDeletion,
  formatLogin,
  formatRemoval,
  formatRunningBids,
  formatTag,
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
    "List the running auctions you bid on, soonest ending first, with your highest bid, the current bid and whether you lead",
  )
  .addHelpText("after", examples("wikimasters auction bids"))
  .action(async () => {
    const auctions = await listRunningBids(await openSession());
    console.log(formatRunningBids(auctions, format()));
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
    "Find the cards of the catalogue whose title, category or summary contains the given text, regardless of case, at most 50; ordered by title, a card titled exactly as the text first when searching titles",
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

const collection = program
  .command("collection")
  .description("Manage your collection");

collection
  .command("list")
  .description(
    "List the cards of your collection, earliest obtained first, with their owned rarity, copies, favourite and shiny state, labels and obtention date",
  )
  .option(
    "--rarity <code>",
    "list only the cards of this owned rarity: C, PC, R, SR, UR or L",
  )
  .addHelpText("after", examples("wikimasters collection list --rarity C"))
  .action(async (filter: CollectionFilter) => {
    const cards = await listCollection(await openSession(), filter);
    console.log(formatCollection(cards, format(), filter.rarity));
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

for (const [name, description, change, example] of [
  [
    "star",
    "Mark a card of your collection as favourite; succeeds if it already is",
    starCard,
    `wikimasters collection star ${EXAMPLE_CARD_ID}`,
  ],
  [
    "unstar",
    "Remove a card of your collection from the favourites; succeeds if it is not a favourite",
    unstarCard,
    `wikimasters collection unstar ${EXAMPLE_CARD_ID}`,
  ],
] as const) {
  collection
    .command(name)
    .description(description)
    .argument("<card-id>", "card UUID")
    .addHelpText("after", examples(example))
    .action(async (rawCardId: string) => {
      const cardId = parseCardId(rawCardId);
      const session = await openSession();
      console.log(formatFavourite(await change(session, cardId), format()));
    });
}

for (const [name, description, change, example] of [
  [
    "tag",
    "Put one of your labels on a card of your collection; succeeds if the card already has it",
    tagCard,
    `wikimasters collection tag ${EXAMPLE_CARD_ID} "Karmine Corp"`,
  ],
  [
    "untag",
    "Remove one of your labels from a card of your collection; succeeds if the card does not have it",
    untagCard,
    `wikimasters collection untag ${EXAMPLE_CARD_ID} "Karmine Corp"`,
  ],
] as const) {
  collection
    .command(name)
    .description(description)
    .argument("<card-id>", "card UUID")
    .argument("<label>", "name of one of your labels")
    .addHelpText("after", examples(example))
    .action(async (rawCardId: string, label: string) => {
      const cardId = parseCardId(rawCardId);
      const session = await openSession();
      console.log(formatTag(await change(session, cardId, label), format()));
    });
}

const labels = program.command("labels").description("Manage your labels");

labels
  .command("create")
  .description(
    "Create a label; succeeds without creating if you already have a label of that name regardless of case",
  )
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
  .description(
    "Delete a label, removing it from your cards; succeeds without deleting if the API finds no label of yours with that name",
  )
  .argument("<name>", "label name")
  .addHelpText("after", examples('wikimasters labels delete "Karmine Corp"'))
  .action(async (name: string) => {
    const session = await openSession();
    console.log(
      formatLabelDeletion(await deleteLabel(session, name), format()),
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
