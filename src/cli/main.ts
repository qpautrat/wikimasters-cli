#!/usr/bin/env node
import { Command } from 'commander';
import { parseCardId, removeFromWishlist, signIn } from '../core/index.js';
import { loadSignInOptions } from './config.js';

const program = new Command('wkm').description('Interact with WikiMasters');

const wishlist = program.command('wishlist').description('Manage your wishlist');

wishlist
  .command('remove')
  .description('Remove a card from your wishlist; succeeds if the card is already absent')
  .argument('<card-id>', 'card UUID')
  .action(async (rawCardId: string) => {
    const cardId = parseCardId(rawCardId);
    const session = await signIn(loadSignInOptions());
    const { removed } = await removeFromWishlist(session, cardId);
    console.log(removed ? `Card ${cardId} removed from the wishlist.` : `Card ${cardId} was not in the wishlist.`);
  });

try {
  await program.parseAsync();
} catch (error) {
  console.error(`wkm: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
