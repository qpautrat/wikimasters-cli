---
name: wikimasters
description: Act on the user's WikiMasters account through the `wikimasters` CLI. Use when the user asks to see or change something in WikiMasters, such as their wishlist ("liste de souhaits"), cards ("cartes"), collection or auctions ("enchères"), e.g. "enlève Half Dome de ma liste de souhaits".
---

# Using `wikimasters`

Run every command from the repo root as `npm run -s wikimasters -- <command> --json`. If `dist/` is missing or older than `src/`, run `npm run -s build` first. `npm run -s wikimasters -- --help` lists the available commands.

## Results and exit codes

- `0`: success. Read the JSON on stdout.
- `4`: the user must log in. Tell them a Firefox window is about to open for them to sign in, run `npm run -s wikimasters -- login --json`, then retry the original command once.
- Any other code: report the stderr message in one sentence. If it names an HTTP 5xx status, retry once before reporting, except for `auction bid`: never rerun it on your own.

## Cards named by the user

The user names cards in natural language. Resolve each name to its id with the list command that matches the request, e.g. `wishlist list` for a card to remove from the wishlist, `collection list` for a card of the collection. Match without regard to case, accents or minor typos:

- exactly one match: act on it;
- several matches: show their titles and rarities, and act only after the user picks one;
- no match: say so and change nothing.

To add a card to the wishlist, ask the user for its id.

Report results by card title, never by id alone.

## Auctions named by the user

Take the auction id from the auction page URL the user gives, `https://www.wiki-masters.com/marketplace/<id>`.

## Limits

- Change the account only when the user asks for it.
- Never read or print `.env` or any session token.
