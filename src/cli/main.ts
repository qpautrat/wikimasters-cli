#!/usr/bin/env node
import { Command } from "commander";
import {
  AuthRequiredError,
  listWishlist,
  loginInBrowser,
  parseCardId,
  removeFromWishlist,
  resumeSession,
  type Session,
} from "../core/index.js";
import { loadConfig, requireRefreshToken, saveRefreshToken } from "./config.js";
import {
  formatLogin,
  formatRemoval,
  formatWishlist,
  type Format,
} from "./output.js";

async function openSession(refreshToken?: string): Promise<Session> {
  const config = loadConfig();
  const session = await resumeSession({
    anonKey: config.anonKey,
    refreshToken: refreshToken ?? requireRefreshToken(config),
  });
  saveRefreshToken(session.refreshToken);
  return session;
}

const EXIT_AUTH_REQUIRED = 4;

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

const wishlist = program
  .command("wishlist")
  .description("Manage your wishlist");

wishlist
  .command("list")
  .description("List the cards of your wishlist, most recently added first")
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
  console.error(
    `wkm: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode =
    error instanceof AuthRequiredError ? EXIT_AUTH_REQUIRED : 1;
}
