# wikimasters-cli

`wikimasters` lets you play [WikiMasters](https://www.wiki-masters.com), the collectible card game built from Wikipedia articles, from the terminal. The site has no public API: the CLI calls the internal HTTP API its web front-end uses.

## Prerequisites

- [Node.js](https://nodejs.org) 22.13.0 or later, with npm.
- A browser, to sign in to the site.
- Optional: Firefox installed as `/Applications/Firefox.app`, needed only by `wikimasters login --firefox`, or Google Chrome installed as `/Applications/Google Chrome.app`, needed only by `wikimasters login --chrome`; both work on macOS only.

## Getting started

1. Install the CLI from npm:

   ```sh
   npm install -g wikimasters-cli
   ```

2. Sign in, as described in [Signing in](#signing-in):

   ```sh
   wikimasters login
   ```

3. Run a first read-only command:

   ```sh
   wikimasters wishlist list
   ```

The CLI knows the site's public Supabase key. To replace it, set `WIKIMASTERS_SUPABASE_ANON_KEY` in the session file described in [Signing in](#signing-in) or in the environment; the file wins, and an empty value is ignored.

## Commands

Run every command from any directory as `wikimasters <command>`. `wikimasters <command> --help` gives its arguments, options and examples. `wikimasters --version` prints the installed version, e.g. `1.4.0`.

| Command | What it does | Example |
|---|---|---|
| `login` | Signs in by pasting your browser's session, or with `--firefox` or `--chrome` through a Firefox or Chrome window it opens on macOS, and stores the session in `~/.config/wikimasters-cli/.env` | `wikimasters login` |
| `cards search <text...> [--in <field>]` | Finds the catalogue cards whose title contains the text, regardless of case, at most 50, ordered by title; `--in category` or `--in summary` searches the card's Wikipedia category or summary instead | `wikimasters cards search half dome` |
| `cards value <card-id...>` | Shows the average sale price in wikibidous of each card, owned or not, for each rarity it sold under, or that it never sold; stops at the first card the game refuses | `wikimasters cards value <card-uuid> <card-uuid>` |
| `cards global [text] [--page <n>] [--sort <field>] [--rarity <code>]... [--wishlist]` | Searches the game's Global Collection, in the card title and category, and prints one page of cards with whether you own or wish each one and the friends who own it with their rarities, then the total, the count by rarity, the pending offers and whether more cards match; options go to the game as given, pages counting from 0, `--rarity` repeated for several rarities, `--wishlist` keeping your wishlist's cards | `wikimasters cards global "Mont Blanc"` |
| `collection list [--rarity <code>] [--page <p>] [--limit <n>]` | Reads a page of your collection, earliest obtained first, with entry id, card id, owned rarity, copies, favourite and shiny state, labels and obtention date, and says when the page is full; `--rarity` keeps one of `C`, `PC`, `R`, `SR`, `UR`, `L`; `--page` reads the next pages, from 1 by default; `--limit` sets the cards per page, 1000 by default | `wikimasters collection list --rarity L --page 2` |
| `collection discard <entry-id...>` | Discards the entries of your collection of those ids, as given by `collection list`, for 1 wikibidou each, in a single request; the game refuses more than 100 ids | `wikimasters collection discard <entry-uuid> <entry-uuid>` |
| `collection star <entry-id>` | Marks an entry of your collection as favourite; fails when the game changes no entry, unknown or not yours | `wikimasters collection star <entry-uuid>` |
| `collection unstar <entry-id>` | Removes an entry of your collection from the favourites; fails when the game changes no entry, unknown or not yours | `wikimasters collection unstar <entry-uuid>` |
| `collection tag <entry-id> <label-id>` | Puts your label of that id, as given by `labels list`, on the entry of your collection of that id, as given by `collection list` | `wikimasters collection tag <entry-uuid> <label-uuid>` |
| `collection untag <entry-id> <label-id>` | Removes your label of that id, as given by `labels list`, from the entry of your collection of that id, as given by `collection list`; says so when the entry did not carry it | `wikimasters collection untag <entry-uuid> <label-uuid>` |
| `friend add <player-id>` | Sends a friend request to the player of that id, in a single request, which stays pending until the player answers, and prints the request id and the status the game gives; the game accepts or refuses it and gives its reason | `wikimasters friend add <player-uuid>` |
| `friend accept <friendship-id>` | Accepts a friend request another player sent you, in a single request, and prints the request id and the status the game gives; the game accepts or refuses it and gives its reason | `wikimasters friend accept <friendship-uuid>` |
| `friend decline <friendship-id>` | Declines a friend request another player sent you, in a single request, and prints the request id and the status the game gives; the game accepts or refuses it and gives its reason | `wikimasters friend decline <friendship-uuid>` |
| `friend remove <friendship-id>` | Removes a friend, or a friend request you sent, given the `friendshipId` of a `friend` or `sent` row of `friend list`, in a single request, and prints the friendship id once the game reports success; the game accepts or refuses it and gives its reason | `wikimasters friend remove <friendship-uuid>` |
| `friend list` | Lists your friends and your pending friend requests, received and sent, in a single request and in the game's order, each with the friendship id, whether it is a `friend`, a `received` or a `sent` request, and the player's id and pseudo | `wikimasters friend list` |
| `guild join <guild-id>` | Accepts the invitation to join the guild of that id, in a single request, and prints the guild id; the game accepts or refuses it and gives its reason | `wikimasters guild join <guild-uuid>` |
| `labels list` | Lists your labels, ordered by name, with their id, name and colour | `wikimasters labels list` |
| `labels create <name> [--color <colour>]` | Creates a label under the name as given and shows its id, name and colour; `--color` is sent to the game as given, a hex colour such as `#facc15` | `wikimasters labels create "Karmine Corp" --color "#facc15"` |
| `labels delete <label-id>` | Deletes your label of that id, as given by `labels list`, which removes it from your cards | `wikimasters labels delete <label-uuid>` |
| `player search <text>` | Lists the players whose pseudo contains the text, regardless of case, with their id and pseudo, and says when the response holds 10 players, the most the game returns; the text is sent as given, and the game finds no player for a text shorter than 2 characters | `wikimasters player search luc` |
| `profile collection <pseudo> [--page <n>] [--sort <field>] [--search <text>] [--rarity <code>]... [--wishlisted]` | Reads a page of a player's collection, at most 50 entries, with each entry's id, card id, title, owned rarity, copies, favourite and shiny state, labels and whether a pending trade holds the card, and says when the page is full; the options are sent to the game as given: `--page` from 0, the first page by default, `--sort` left out by default, `--rarity` repeated for several rarities, `--wishlisted` keeps the cards of your wishlist | `wikimasters profile collection LucasPerso --rarity UR` |
| `profile me` | Shows every field of your profile as the game returns it, such as `wikibidous_balance`, your wikibidous balance | `wikimasters profile me` |
| `trade propose <player-id> [--give <entry-id>:<card-id>]... [--take <entry-id>:<card-id>]... [--give-wikibidous <n>] [--take-wikibidous <n>] [--counter <trade-id>]` | Proposes a trade to the player of that id, in a single request, and prints the trade id; `--give` offers an entry of your collection with its card, as given by `collection list`, `--take` asks for an entry of the player's collection with its card, as given by `profile collection`, each repeated for several cards; `--give-wikibidous` and `--take-wikibidous` set the wikibidous you give and ask for, 0 by default; `--counter` sends it as a counter-offer to that trade; the game accepts or refuses it and gives its reason | `wikimasters trade propose <player-uuid> --give <entry-uuid>:<card-uuid> --take <entry-uuid>:<card-uuid>` |
| `trade list` | Lists the trades you proposed and those proposed to you, all or only those in the `--status` given as `trade list` prints it, in a single request and in the game's order, each with its id, status, date, the player who proposes it and the one who receives it, the trade it answers if any, and for each player the cards given, with entry id, card id and title, and the wikibidous given | `wikimasters trade list`, `wikimasters trade list --status pending` |
| `trade cancel <trade-id>` | Cancels a trade you proposed, in a single request, and prints the trade id and the status the game gives; the game accepts or refuses it and gives its reason | `wikimasters trade cancel <trade-uuid>` |
| `trade accept <trade-id>` | Accepts a trade another player proposed to you, in a single request, and prints the trade id and the status the game gives; the game accepts or refuses it and gives its reason | `wikimasters trade accept <trade-uuid>` |
| `wishlist list` | Lists your wishlist, most recently added first, marking the cards already in your collection | `wikimasters wishlist list` |
| `wishlist add <card-id>` | Adds a catalogue card to your wishlist | `wikimasters wishlist add <card-uuid>` |
| `wishlist remove <card-id>` | Removes a card from your wishlist | `wikimasters wishlist remove <card-uuid>` |
| `notifications list [--type <type>]... [--unread] [--after <date>] [--page <p>] [--limit <n>]` | Reads a page of your notifications, most recent first, with date, type, whether it is unread, message and the other data the game attaches to it, such as the auction, card, player or trade concerned, and says when the page is full; `--type` keeps a type, sent as given, e.g. `marketplace_wishlist_listed`, repeated for several types; `--unread` keeps the unread ones; `--after` keeps those received strictly after a date, sent as given; `--page` reads the next pages, from 1 by default; `--limit` sets the notifications per page, 50 by default | `wikimasters notifications list --type marketplace_wishlist_listed --after 2026-10-16T13:31:00+00:00` |
| `auction list [--status <status>] [--limit <n>]` | Lists auctions in the order the game returns them, at most 50 by default, with card, status, end time, starting price, current bid, and whether you lead or sell them; `--status` keeps one status, e.g. `active` | `wikimasters auction list --status active --limit 20` |
| `auction search <text...> [--limit <n>] [--page <p>]` | Lists the auctions the game matches with the text, as the marketplace search field does, in its order, at most 50 by default, with the same details as `auction list`; `--page` reads the next pages, from 1 by default | `wikimasters auction search croix celtique` |
| `auction show <auction-id>` | Shows an auction's card, status, end time, starting price, current bid, and whether you lead or sell it | `wikimasters auction show 6e6bd506-4045-445c-8b6f-16a29592fe4d` |
| `auction bids [--page <p>] [--limit <n>]` | Reads a page of your bids on running auctions, in the order the game returns them, with auction id, card title, amount, date, the current bid, whether you lead and the end time, and says when the page is full; `--page` reads the next pages, from 1 by default; `--limit` sets the bids per page, 1000 by default | `wikimasters auction bids --page 2` |
| `auction create <entry-id> <starting-price> <duration>` | Puts the entry of your collection of that id, as given by `collection list`, up for auction at a starting price in wikibidous, for a duration in minutes, and prints the auction id; the game accepts or refuses it and gives its reason | `wikimasters auction create <entry-uuid> 50 60` |
| `auction cancel <auction-id>` | Cancels one of your auctions so its card returns to your collection, under a new id, and prints the auction id; the game accepts or refuses it and gives its reason | `wikimasters auction cancel <auction-uuid>` |
| `auction bid <auction-id> <amount>` | Bids an exact amount of wikibidous on an auction; the game accepts or refuses it and gives its reason | `wikimasters auction bid <auction-uuid> 25` |

A card id is the `id` that `cards search`, `cards global`, `collection list`, `profile collection` and `wishlist list` print, or the `card_id` in the data of a notification `notifications list` prints. An entry id is the `entryId` that `collection list` and `profile collection` print. A label id is the `id` that `labels list` and `labels create` print. A player id is the `id` that `player search` prints, or the `id` of a friend that `cards global` prints. A friendship id is the `friendshipId` that `friend list` prints. A guild id is the `guild_id` in the data of a `guild_invite` notification `notifications list` prints. A trade id is the `tradeId` that `trade propose` and `trade list` print, or the `trade_id` in the data of a notification `notifications list` prints. An auction id is the `id` that `auction list`, `auction search` and `auction bids` print, the `auctionId` that `auction create` prints, the `auction_id` in the data of a notification `notifications list` prints, or the last part of the auction page URL, `https://www.wiki-masters.com/marketplace/<auction-id>`.

### Output and exit codes

Results are text by default. With the global `--json` option, stdout carries only the result as JSON, e.g. `wikimasters wishlist list --json`. Messages and errors go to stderr.

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | Failure: invalid argument, refusal by the game, network error. `collection discard` also exits 1 when the game refused some of the entries, after printing which ones and why. |
| `4` | You must sign in: no stored session, or the session expired, was revoked or was rejected by the API. Run `wikimasters login` again. |
| `75` | The API stayed unavailable after the CLI's own retries. Retry later. |

## Signing in

The site signs in with an email and a password behind a captcha, so the CLI never signs in by itself: it takes the session of a browser where you signed in.

1. Open `https://www.wiki-masters.com/login` in a private browser window and sign in.
2. Open the developer tools: Storage tab in Firefox, Application tab in Chrome. In the cookies of `www.wiki-masters.com`, copy the value of `sb-cyrxjeppjqsxxjayfrur-auth-token`, or of each of its chunks `sb-cyrxjeppjqsxxjayfrur-auth-token.0`, `.1`…
3. Close the private window without logging out.
4. Run `wikimasters login` and paste each value in order, pressing Enter after each one. What you paste is not displayed: the CLI shows the number and length of each chunk it receives, and goes on by itself once the session is complete. An empty line or the end of the input stops reading; if the session is still incomplete, the login fails.

On macOS with Firefox, `wikimasters login --firefox` does the same without copying anything: it opens Firefox on a throwaway profile, you sign in there, and the CLI reads the cookie from that profile, closes Firefox and deletes the profile. It waits 5 minutes at most. On macOS with Google Chrome, `wikimasters login --chrome` does the same with Chrome, without touching your usual Chrome profile or the macOS keychain; Chrome writes the cookie to disk up to 30 seconds after you sign in, so the window closes within that delay. The two options cannot be combined. On macOS, `wikimasters login` reminds you of these options before its copy instructions.

What the CLI does with your session:

- It never sees your email or your password: you sign in on the site itself.
- The value you paste is a session, not your credentials. The CLI keeps only its refresh token, which Supabase, the site's back-end, replaces on every use: each command exchanges it for a new one, which only works once.
- The refresh token is stored only in `$XDG_CONFIG_HOME/wikimasters-cli/.env`, or `~/.config/wikimasters-cli/.env` when `XDG_CONFIG_HOME` is unset or empty, a file outside the repository that the CLI creates and makes readable by its owner only on macOS and Linux. The CLI never prints it.
- The session is sent only where the browser sends it: the site's Supabase (`https://cyrxjeppjqsxxjayfrur.supabase.co`) and the site's own `/api/...` routes (`https://www.wiki-masters.com`).
- Close the private window without logging out because logging out ends the very session you paste. Closing the window also stops the browser from refreshing that session: Supabase revokes a whole session when one of its used refresh tokens is reused, so the browser and the CLI cannot share it.
- Logging out on the site ends the CLI's session when it ends all your sessions, which is what Supabase's JavaScript sign-out does by default. The next command then exits with code 4; run `wikimasters login` again.

The code handling the session:

| File | Role |
|---|---|
| `src/cli/pasted-session.ts` | reads the pasted cookie value |
| `src/core/browser-login.ts` | reads the cookie from the throwaway Firefox or Chrome profile |
| `src/core/auth-cookie.ts` | extracts the refresh token from the cookie, and builds the cookie sent to the `/api/...` routes |
| `src/cli/config.ts` | reads the session file and writes the new refresh token to it |
| `src/cli/session.ts`, `src/core/session.ts` | exchange the refresh token with Supabase and send the session with every Supabase request |
| `src/core/site.ts` | sends the session to the site's `/api/...` routes |

## Running from a clone

To contribute, run the CLI from a clone instead, with [mise](https://mise.jdx.dev), which installs the pinned Node version and the git hook tools:

```sh
git clone https://github.com/qpautrat/wikimasters-cli.git
cd wikimasters-cli
mise trust
mise install
```

Then run every command from the repository root as `mise run wikimasters -- <command>`, e.g. `mise run wikimasters -- wishlist list`. Each command first rebuilds the CLI from `src/`. When that build fails, the CLI does not run: stderr carries the compiler errors, and the command exits 1. When a command fails, mise adds the line `[wikimasters] ERROR task failed` after the CLI's message.

## Learn more

- [`docs/api.md`](docs/api.md): the tables and routes of the site's API the CLI uses.
- [`docs/game-rules.md`](docs/game-rules.md): the game rules the API enforces.
- To contribute, read [`CLAUDE.md`](CLAUDE.md) for the architecture and commands.
