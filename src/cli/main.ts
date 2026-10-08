#!/usr/bin/env node
import { Command } from "commander";
import {
  AUCTION_LIMIT,
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
  parseBidAmount,
  parseCardId,
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
import { openSession, reportFailure } from "./session.js";

const program = new Command("wikimasters")
  .description("Interact with WikiMasters")
  .option("--json", "print the result as JSON on stdout")
  .configureHelp({ showGlobalOptions: true });

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
  .action(async ({ limit, ...filter }: AuctionFilter & { limit: string }) => {
    const maximum = parseAuctionLimit(limit);
    const auctions = await listAuctions(await openSession(), filter, maximum);
    console.log(formatAuctions(auctions, format(), filter.status));
  });

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
  .action(async (words: string[], { limit }: { limit: string }) => {
    const maximum = parseAuctionLimit(limit);
    const session = await openSession();
    const result = await searchAuctions(session, words.join(" "), maximum);
    console.log(formatAuctionSearch(result, format()));
  });

auction
  .command("show")
  .description(
    "Show an auction's card, status, end time, starting price, current bid, and whether you lead or sell it",
  )
  .argument("<auction-id>", "auction UUID")
  .action(async (rawAuctionId: string) => {
    const auctionId = parseAuctionId(rawAuctionId);
    const session = await openSession();
    console.log(formatAuction(await showAuction(session, auctionId), format()));
  });

const cards = program.command("cards").description("Browse the card catalogue");

cards
  .command("search")
  .description(
    "Find the cards of the catalogue whose title contains the given text, regardless of case, exact title first, at most 50",
  )
  .argument("<name...>", "all or part of the card title")
  .action(async (words: string[]) => {
    const result = await searchCards(await openSession(), words.join(" "));
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
  .action(async (rawCardIds: string[]) => {
    const cardIds = rawCardIds.map(parseCardId);
    const result = await discardCards(await openSession(), cardIds);
    console.log(formatDiscard(result, format()));
    if (result.failed.length > 0) process.exitCode = 1;
  });

for (const [name, description, change] of [
  [
    "star",
    "Mark a card of your collection as favourite; succeeds if it already is",
    starCard,
  ],
  [
    "unstar",
    "Remove a card of your collection from the favourites; succeeds if it is not a favourite",
    unstarCard,
  ],
] as const) {
  collection
    .command(name)
    .description(description)
    .argument("<card-id>", "card UUID")
    .action(async (rawCardId: string) => {
      const cardId = parseCardId(rawCardId);
      const session = await openSession();
      console.log(formatFavourite(await change(session, cardId), format()));
    });
}

for (const [name, description, change] of [
  [
    "tag",
    "Put one of your labels on a card of your collection; succeeds if the card already has it",
    tagCard,
  ],
  [
    "untag",
    "Remove one of your labels from a card of your collection; succeeds if the card does not have it",
    untagCard,
  ],
] as const) {
  collection
    .command(name)
    .description(description)
    .argument("<card-id>", "card UUID")
    .argument("<label>", "name of one of your labels")
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
  .action(async (rawCardId: string) => {
    const cardId = parseCardId(rawCardId);
    const session = await openSession();
    console.log(
      formatRemoval(await removeFromWishlist(session, cardId), format()),
    );
  });

try {
  await program.parseAsync();
} catch (error) {
  reportFailure("wikimasters", error);
}
