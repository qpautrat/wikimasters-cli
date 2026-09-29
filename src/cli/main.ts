#!/usr/bin/env node
import { Command } from 'commander';
import { loginInBrowser, parseCardId, removeFromWishlist, resumeSession, type Session } from '../core/index.js';
import { loadConfig, requireRefreshToken, saveRefreshToken } from './config.js';

async function openSession(refreshToken?: string): Promise<Session> {
  const config = loadConfig();
  const session = await resumeSession({ anonKey: config.anonKey, refreshToken: refreshToken ?? requireRefreshToken(config) });
  saveRefreshToken(session.refreshToken);
  return session;
}

const program = new Command('wkm').description('Interact with WikiMasters');

program
  .command('login')
  .description('Sign in through a browser window and store the session in .env')
  .action(async () => {
    loadConfig();
    console.error('Sign in to WikiMasters in the Firefox window that just opened; it closes once the session is found…');
    const session = await openSession(await loginInBrowser());
    console.log(`Logged in as user ${session.userId}.`);
  });

const wishlist = program.command('wishlist').description('Manage your wishlist');

wishlist
  .command('remove')
  .description('Remove a card from your wishlist; succeeds if the card is already absent')
  .argument('<card-id>', 'card UUID')
  .action(async (rawCardId: string) => {
    const cardId = parseCardId(rawCardId);
    const session = await openSession();
    const { removed } = await removeFromWishlist(session, cardId);
    console.log(removed ? `Card ${cardId} removed from the wishlist.` : `Card ${cardId} was not in the wishlist.`);
  });

try {
  await program.parseAsync();
} catch (error) {
  console.error(`wkm: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
