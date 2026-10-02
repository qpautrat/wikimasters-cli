#!/usr/bin/env node
import { Command } from "commander";
import {
  discardCommons,
  listWishlist,
  loginInBrowser,
  parseCardId,
  removeFromWishlist,
} from "../core/index.js";
import { loadConfig } from "./config.js";
import {
  formatDiscard,
  formatLogin,
  formatRemoval,
  formatWishlist,
  type Format,
} from "./output.js";
import { openSession, reportFailure } from "./session.js";

const program = new Command("wkm")
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

const collection = program
  .command("collection")
  .description("Manage your collection");

collection
  .command("discard-commons")
  .description(
    "Discard every common card of your collection, except favourite and shiny ones, for wikibidous",
  )
  .action(async () => {
    console.log(
      formatDiscard(await discardCommons(await openSession()), format()),
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
  reportFailure("wkm", error);
}
