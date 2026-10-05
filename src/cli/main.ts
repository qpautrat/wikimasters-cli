#!/usr/bin/env node
import { Command } from "commander";
import {
  discardCommons,
  listWishlist,
  loginInBrowser,
  parseAuctionId,
  parseCardId,
  placeMinimumBid,
  removeFromWishlist,
  starCard,
  tagCard,
  unstarCard,
} from "../core/index.js";
import { loadConfig } from "./config.js";
import {
  formatBid,
  formatDiscard,
  formatFavourite,
  formatLogin,
  formatRemoval,
  formatTag,
  formatWishlist,
  type Format,
} from "./output.js";
import { openSession, reportFailure } from "./session.js";

const program = new Command("wikimasters")
  .description("Interact with WikiMasters")
  .option("--json", "print the result as JSON on stdout")
  .configureHelp({ showGlobalOptions: true });

function format(): Format {
  return program.opts<{ json?: boolean }>().json ? "json" : "text";
}

program
  .command("login")
  .description("Sign in through a browser window and store the session in .env")
  .action(async () => {
    loadConfig();
    console.error(
      "Sign in to WikiMasters in the Firefox window that just opened; it closes once the session is found…",
    );
    const session = await openSession(await loginInBrowser());
    console.log(formatLogin(session.userId, format()));
  });

const auction = program.command("auction").description("Take part in auctions");

auction
  .command("bid")
  .description("Place the minimum bid the game accepts on an auction")
  .argument("<auction-id>", "auction UUID")
  .action(async (rawAuctionId: string) => {
    const auctionId = parseAuctionId(rawAuctionId);
    const session = await openSession();
    console.log(formatBid(await placeMinimumBid(session, auctionId), format()));
  });

const collection = program
  .command("collection")
  .description("Manage your collection");

collection
  .command("discard-commons")
  .description(
    "Discard every common card of your collection, except favourite, shiny, labelled and pending-trade ones, for 1 wikibidou each; exits 1 if the site failed to discard some",
  )
  .action(async () => {
    const result = await discardCommons(await openSession());
    console.log(formatDiscard(result, format()));
    if (result.failed.length > 0) process.exitCode = 1;
  });

for (const [name, description, change] of [
  [
    "star",
    "Mark a card of your collection as favourite, which protects it from discard-commons; succeeds if it already is",
    starCard,
  ],
  [
    "unstar",
    "Remove a card of your collection from the favourites, which lifts its protection from discard-commons; succeeds if it is not a favourite",
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

collection
  .command("tag")
  .description(
    "Put one of your labels on a card of your collection, which protects it from discard-commons; succeeds if the card already has it",
  )
  .argument("<card-id>", "card UUID")
  .argument("<label>", "name of one of your labels")
  .action(async (rawCardId: string, label: string) => {
    const cardId = parseCardId(rawCardId);
    const session = await openSession();
    console.log(formatTag(await tagCard(session, cardId, label), format()));
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
