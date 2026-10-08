# wikimasters-cli

`wikimasters` lets you play [WikiMasters](https://www.wiki-masters.com), the collectible card game built from Wikipedia articles, from the terminal or through an AI agent. The site has no public API: the CLI calls the internal HTTP API its web front-end uses.

## Prerequisites

- [mise](https://mise.jdx.dev), which installs the pinned Node version and the git hook tools.
- A browser, to sign in to the site.
- For `login --firefox` only: Firefox installed in `/Applications` on macOS.

## Getting started

1. Clone the repository, install the tools and dependencies, and build the CLI:

   ```sh
   git clone https://github.com/qpautrat/wikimasters-cli.git
   cd wikimasters-cli
   mise trust
   mise install
   ```

2. Sign in, as described in [Signing in](#signing-in):

   ```sh
   mise run wikimasters -- login
   ```

3. Run a first read-only command:

   ```sh
   mise run wikimasters -- wishlist list
   ```

The CLI knows the site's public Supabase key. To replace it, set `WIKIMASTERS_SUPABASE_ANON_KEY` in `.env` at the repository root or in the environment; `.env` wins, and an empty value is ignored.

## Commands

Run every command from the repository root as `mise run wikimasters -- <command>`. `mise run wikimasters -- <command> --help` gives its arguments, options and examples.

| Command | What it does | Example |
|---|---|---|
| `login` | Signs in by pasting your browser's session, or with `--firefox` through a Firefox window it opens on macOS, and stores the session in `.env` | `mise run wikimasters -- login` |
| `cards search <name...>` | Finds the catalogue cards whose title contains the text, regardless of case, exact title first, at most 50 | `mise run wikimasters -- cards search half dome` |
| `collection list [--rarity <code>]` | Lists your collection, earliest obtained first, with owned rarity, copies, favourite and shiny state, labels and obtention date; `--rarity` keeps one of `C`, `PC`, `R`, `SR`, `UR`, `L` | `mise run wikimasters -- collection list --rarity L` |
| `collection discard <card-id...>` | Discards cards of your collection for 1 wikibidou each | `mise run wikimasters -- collection discard <card-uuid> <card-uuid>` |
| `collection star <card-id>` | Marks a card of your collection as favourite | `mise run wikimasters -- collection star <card-uuid>` |
| `collection unstar <card-id>` | Removes a card of your collection from the favourites | `mise run wikimasters -- collection unstar <card-uuid>` |
| `collection tag <card-id> <label>` | Puts one of your labels on a card of your collection | `mise run wikimasters -- collection tag <card-uuid> Favourites` |
| `collection untag <card-id> <label>` | Removes one of your labels from a card of your collection | `mise run wikimasters -- collection untag <card-uuid> Favourites` |
| `labels create <name> [--color <colour>]` | Creates a label, or reports the one you already have under that name regardless of case; `--color` is sent to the game as given, a hex colour such as `#facc15` | `mise run wikimasters -- labels create "Karmine Corp" --color "#facc15"` |
| `labels delete <name>` | Deletes your label named `<name>`, matched by the API on the name as given, which removes it from your cards, or says you have none | `mise run wikimasters -- labels delete "Karmine Corp"` |
| `wishlist list` | Lists your wishlist, most recently added first, marking the cards already in your collection | `mise run wikimasters -- wishlist list` |
| `wishlist add <card-id>` | Adds a catalogue card to your wishlist | `mise run wikimasters -- wishlist add <card-uuid>` |
| `wishlist remove <card-id>` | Removes a card from your wishlist | `mise run wikimasters -- wishlist remove <card-uuid>` |
| `auction list [--status <status>] [--limit <n>]` | Lists auctions in the order the game returns them, at most 50 by default, with card, status, end time, starting price, current bid, and whether you lead or sell them; `--status` keeps one status, e.g. `active` | `mise run wikimasters -- auction list --status active --limit 20` |
| `auction search <text...> [--limit <n>] [--page <p>]` | Lists the auctions the game matches with the text, as the marketplace search field does, in its order, at most 50 by default, with the same details as `auction list`; `--page` reads the next pages, from 1 by default | `mise run wikimasters -- auction search croix celtique` |
| `auction show <auction-id>` | Shows an auction's card, status, end time, starting price, current bid, and whether you lead or sell it | `mise run wikimasters -- auction show 6e6bd506-4045-445c-8b6f-16a29592fe4d` |
| `auction bids` | Lists the running auctions you bid on, soonest ending first, with your highest bid, the current bid and whether you lead | `mise run wikimasters -- auction bids` |
| `auction bid <auction-id> <amount>` | Bids an exact amount of wikibidous on an auction; the game accepts or refuses it and gives its reason | `mise run wikimasters -- auction bid <auction-uuid> 25` |

A card id is the `id` that `cards search`, `collection list` and `wishlist list` print. An auction id is the `id` that `auction list`, `auction search` and `auction bids` print, or the last part of the auction page URL, `https://www.wiki-masters.com/marketplace/<auction-id>`.

### Output and exit codes

Results are text by default. With the global `--json` option, stdout carries only the result as JSON, e.g. `mise run wikimasters -- wishlist list --json`. Messages and errors go to stderr. When a command fails, mise adds the line `[wikimasters] ERROR task failed` after the CLI's message.

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | Failure: invalid argument, refusal by the game, network error. `collection discard` also exits 1 when the game refused some of the cards, after printing which ones and why. |
| `4` | You must sign in: no stored session, or the session expired, was revoked or was rejected by the API. Run `mise run wikimasters -- login` again. |
| `75` | The API stayed unavailable after the CLI's own retries. Retry later. |

Each command first rebuilds the CLI from `src/`. When that build fails, the CLI does not run: stderr carries the compiler errors, and the command exits 1.

## Playing through an agent

Open [Claude Code](https://claude.com/claude-code) at the repository root and ask in natural language. The `wikimasters` skill in `.claude/skills/` turns your request into CLI commands, resolves card names to ids, and asks you to sign in when a command exits with code 4. For example:

- "Remove Half Dome from my wishlist."
- "Which auctions am I leading?"

Write your way of playing in a `CLAUDE.local.md` at the repository root, which git ignores: which cards to discard, how to bid, how you sign in. The agent follows it for every command it runs on your account.

## Signing in

The site signs in with an email and a password behind a captcha, so the CLI never signs in by itself: it takes the session of a browser where you signed in.

1. Open `https://www.wiki-masters.com/login` in a private browser window and sign in.
2. Open the developer tools: Storage tab in Firefox, Application tab in Chrome. In the cookies of `www.wiki-masters.com`, copy the value of `sb-cyrxjeppjqsxxjayfrur-auth-token`, or of each of its chunks `sb-cyrxjeppjqsxxjayfrur-auth-token.0`, `.1`…
3. Close the private window without logging out.
4. Run `mise run wikimasters -- login` and paste each value in order, one per line, then an empty line. What you paste is not displayed.

On macOS with Firefox, `mise run wikimasters -- login --firefox` does the same without copying anything: it opens Firefox on a throwaway profile, you sign in there, and the CLI reads the cookie from that profile, closes Firefox and deletes the profile. It waits 5 minutes at most.

What the CLI does with your session:

- It never sees your email or your password: you sign in on the site itself.
- The value you paste is a session, not your credentials. The CLI keeps only its refresh token, which Supabase, the site's back-end, replaces on every use: each command exchanges it for a new one, which only works once.
- The refresh token is stored only in `.env` at the repository root, which git ignores and which the CLI makes readable by its owner only on macOS and Linux. The CLI never prints it.
- The session is sent only where the browser sends it: the site's Supabase (`https://cyrxjeppjqsxxjayfrur.supabase.co`) and the site's own `/api/...` routes (`https://www.wiki-masters.com`).
- Close the private window without logging out because logging out ends the very session you paste. Closing the window also stops the browser from refreshing that session: Supabase revokes a whole session when one of its used refresh tokens is reused, so the browser and the CLI cannot share it.
- Logging out on the site ends the CLI's session when it ends all your sessions, which is what Supabase's JavaScript sign-out does by default. The next command then exits with code 4; run `mise run wikimasters -- login` again.

The code handling the session:

| File | Role |
|---|---|
| `src/cli/pasted-session.ts` | reads the pasted cookie value |
| `src/core/browser-login.ts` | reads the cookie from the throwaway Firefox profile |
| `src/core/auth-cookie.ts` | extracts the refresh token from the cookie, and builds the cookie sent to the `/api/...` routes |
| `src/cli/config.ts` | reads `.env` and writes the new refresh token to it |
| `src/cli/session.ts`, `src/core/session.ts` | exchange the refresh token with Supabase and send the session with every Supabase request |
| `src/core/site.ts` | sends the session to the site's `/api/...` routes |

## Learn more

- [`docs/api.md`](docs/api.md): the tables and routes of the site's API the CLI uses.
- [`docs/game-rules.md`](docs/game-rules.md): the game rules the API enforces.
- To contribute, read [`CLAUDE.md`](CLAUDE.md) for the architecture and commands, and [`specs/`](specs/) for the specifications that drive the project.
