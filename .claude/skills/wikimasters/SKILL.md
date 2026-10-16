---
name: wikimasters
description: Act on the user's WikiMasters account through the `wikimasters` CLI. Use when the user asks to see or change something in WikiMasters, such as their wishlist ("liste de souhaits"), cards ("cartes"), collection, auctions ("enchères") or notifications, e.g. "enlève Half Dome de ma liste de souhaits".
---

# Using `wikimasters`

Run every command from the repo root as `mise run wikimasters -- <command> --json`. `mise run wikimasters -- --help` lists the available commands.

## Results and exit codes

On a non-zero exit, mise adds the line `[wikimasters] ERROR task failed` to stderr after the CLI's message: never report that line as the CLI's message.

- `0`: success. Read the JSON on stdout.
- `4`: the user must log in, whatever the stderr message says to run. Use the login method the user's instructions name; when they name none, ask the user which one to use. Never ask the user to share the session or its cookie in the conversation.
  - `login --firefox`, on macOS: tell the user a Firefox window is about to open for them to sign in, run `mise run wikimasters -- login --firefox` with a tool timeout above the 5 minutes it waits for the sign-in, then retry the original command once. If the login fails, report its stderr message and do not retry.
  - `login`, where the user pastes the session in a terminal: do not run it. Ask the user to run `mise -C '<repo root>' run wikimasters -- login` in a terminal, with the absolute path `git rev-parse --show-toplevel` prints, single-quoted, and retry the original command once when they say they are logged in.
- `75`: the API stayed unavailable after the CLI's own retries. Report the stderr message in one sentence and tell the user to retry later; do not rerun the command on your own. If the message says the request may have taken effect, tell the user to check its outcome first.
- `1` with JSON on stdout: the command partly succeeded. Report its result, naming each entry it lists as refused with the reason given.
- Any other code: report the stderr message in one sentence.

## Cards named by the user

The user names cards in natural language. Resolve each name to its id with the list command that matches the request, e.g. `wishlist list` for a card to remove from the wishlist, `collection list` for a card of the collection, `cards search <name>` for any card of the catalogue. Match without regard to case, accents or minor typos:

- exactly one match: act on it;
- several matches: show their titles and rarities, and act only after the user picks one;
- no match: say so and change nothing.

`collection list` reads one page of the collection: while the page is full (`full` true with `--json`), read the next one with `--page`, before concluding a card is not in the collection.

`collection discard`, `collection star`, `collection unstar`, `collection tag`, `collection untag` and `auction create` take the entry id, the `entryId` that `collection list` prints, not the card id.

`collection tag`, `collection untag` and `labels delete` take the label id, the `id` that `labels list` or `labels create` prints, not its name.

When `cards search` finds nothing, search again with a shorter part of the name, free of accented letters, before concluding there is no match.

For cards named by a theme rather than a title, such as a team or a kind of place, search it with `cards search <text> --in category` or `--in summary`.

Report results by card title, never by id alone.

## Auctions named by the user

Take the auction id from the auction page URL the user gives, `https://www.wiki-masters.com/marketplace/<id>`.

For an auction named by its card title, resolve the id with `auction bids`, reading the next page while the page is full, then `auction search <title>`, matching the title as for cards. Without a match from either, ask the user for the auction page URL.

`auction bid` takes the amount to bid. When the user names no amount, take it from the user's instructions; when they give none, ask the user.

`auction create` takes the starting price and the duration in minutes. When the user names no starting price or no duration, take it from the user's instructions; when they give none, ask the user.

## Limits

- Change the account only when the user asks for it.
- Never read or print `.env` or any session token.
