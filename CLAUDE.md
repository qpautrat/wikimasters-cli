# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`wikimasters-cli` lets an AI agent interact with [WikiMasters](https://www.wiki-masters.com), a collectible card game built from Wikipedia articles (packs, collection, duels, trades, auctions, guilds, messaging). The site has no public API: this project wraps the internal HTTP API used by its web front-end.

That front-end is a Next.js app whose data layer is Supabase: the browser calls PostgREST directly at `https://cyrxjeppjqsxxjayfrur.supabase.co/rest/v1/<table>` with the user's session JWT. A few routes go through the Next.js server instead (`https://www.wiki-masters.com/api/...`). Reads are discovered by querying the API read-only; writes, RPC functions and `/api/...` routes by chaining commands and direct requests on the account, with HAR captures of the manual flows, kept sanitized and gitignored in `capture-reseau-har/`, as a last resort (see `.claude/rules/api-discovery.md`). `docs/api.md` describes every table and route the core uses. `docs/game-rules.md` records the rules the API enforces without revealing them, as the user states them.

## Stack and commands

TypeScript (ESM, `nodenext`) on Node, `@supabase/supabase-js` for auth and PostgREST, `commander` for the CLI, Vitest for tests.

`mise.toml` pins the exact Node version used to develop and the tools git calls (lefthook, `betterleaks`, `jq`); `package.json` `engines` keeps the minimum Node supported at runtime. Tools called by npm scripts stay devDependencies, locked by `package-lock.json`. `mise install` installs the pinned tools, then runs `npm ci` and `lefthook install`.

| Task | Command |
|---|---|
| Install tools, dependencies and the git hook | `mise install` |
| Build to `dist/` | `npm run build` |
| Typecheck | `npm run typecheck` |
| Lint `src/` and `tools/` / apply safe fixes | `npm run lint` / `npm run lint:fix` |
| Check formatting of `src/` and `tools/` / format it | `npm run format:check` / `npm run format` |
| All tests | `npm test` |
| One test file / one test | `npx vitest run src/core/wishlist.test.ts` / `npx vitest run -t "already absent"` |
| Run the CLI after a build | `npm run -s wikimasters -- login`, then `npm run -s wikimasters -- wishlist remove <card-uuid>` |
| Query a table read-only with the stored session (compiles the tool first) | `npm run -s api:get -- 'user_cards?select=*&limit=1'` |
| Send one request to the Next.js site with the stored session; status on stderr, body on stdout (compiles the tool first) | `npm run -s api:site -- GET /api/wikibidous` |

The lefthook pre-commit hook (`lefthook.yml`) runs on every commit. It refuses any `.env` file, any `.har` capture, and any secret `betterleaks` (pinned in `mise.toml`) finds in the staged changes. Then `scripts/verify-staged.sh` exports the staged content to a temporary directory, installs the staged dependencies there with `npm ci`, and runs the typecheck, lint, format check, tests, build and tools build there, so each commit is checked as it will be recorded, whatever the working tree holds. A failing check refuses the commit. Never pass `--no-verify`, including with `--amend`.

Edit `.claude/settings.json` directly, after reading the docs through Context7; never load the `update-config` skill.

Tests sit next to the code as `*.test.ts` and never hit the network: they pass a fake `fetch` from `src/core/testing/fake-supabase.ts` to `resumeSession`, which simulates Supabase's auth and PostgREST responses. `tsconfig.json` covers every file and serves the typecheck and the editor; `tsconfig.build.json` builds `src/` to `dist/`, without test files and `testing/`.

Before committing a command, run it on the account against data in the state its spec targets, read just before the run (e.g. an auction with `status=eq.active` and `end_at` a few minutes ahead), and check its output against each acceptance criterion.

Update `README.md` in the commit that adds, changes or removes a command, or changes the installation.

Dev tools such as `api:get` and `api:site` live in `tools/`, outside `src/`, and never reach `dist/`. They import the core and `src/cli/session.ts`. The npm script running a tool first compiles it with `tsconfig.tools.json`, along with the code it imports, into the gitignored `dist-tools/`.

Supabase auth on this project requires a captcha, so there is no password sign-in: the session comes from a browser where the user signed in. `wikimasters login` asks the user to paste the `sb-<ref>-auth-token` cookie value, or its `.0`, `.1`… chunks, one per line without echo on a terminal, and reads the refresh token from it. `wikimasters login --firefox` starts the installed Firefox on macOS, unautomated, on a throwaway profile; the user signs in there, and the CLI reads the refresh token from the `sb-<ref>-auth-token` cookies in the profile's `cookies.sqlite` (through the `sqlite3` CLI), then closes Firefox and deletes the profile. A browser driven by Playwright/WebDriver fails the captcha. Every command then exchanges that refresh token for a session. Supabase rotates refresh tokens on each use, so the CLI writes the new one back to `.env` right after the exchange, before doing anything else. Never solve the captcha programmatically or hide browser automation from it.

The core holds the site's public Supabase key, found in its JavaScript bundle, as `SUPABASE_ANON_KEY`, which `resumeSession` uses unless given another. The CLI reads `WIKIMASTERS_SUPABASE_ANON_KEY`, which replaces that key when non-empty, and `WIKIMASTERS_REFRESH_TOKEN` (managed by `wikimasters login`) from `.env` at the repo root, falling back to the environment. The file wins because it holds the latest rotated token. `.env` is gitignored; the template is `.env.example`. Never print the refresh token.

## Architecture

Two layers, kept strictly separate:

1. **Core client** (`src/core/`, public surface in `index.ts`): a typed wrapper over WikiMasters' internal HTTP endpoints, covering session/auth, requests and parsing responses into domain types. It is the only place that knows endpoint URLs and payload shapes, so a change on the site is fixed in one spot. It does no terminal output and no argument parsing.
2. **Adapters** (`src/cli/`): thin consumers of the core that map input to core calls and format output, with no business logic. The CLI (`wikimasters`) is the only adapter in scope. An MCP server is planned and must reuse the core unchanged.

The CLI is an adapter over the game's API and adds no rule of its own. Game rules belong to the API alone: the core never reproduces a rule the web interface applies without the API imposing it, it sends the request and reports the API's refusal. The player's way of playing lives in how the agent composes the commands, written in the player's own untracked `CLAUDE.local.md`, never in the code. That file can also give the player's login method, which the `wikimasters` skill follows on exit code 4.

A feature lands in the core first, then gets exposed through the CLI. Core failures throw `WikiMastersError`; the CLI prints its message to stderr and exits 1, 4 for its `AuthRequiredError` subclass (no session, refresh token expired or revoked, HTTP 401), which tells the agent the user must log in, or 75 for its `ApiUnavailableError` subclass (HTTP 502, 503, 504 or 520 to 526 after the retries), which tells the agent to retry later. Build API errors with `apiFailure` so a 401 maps to `AuthRequiredError` and a transient status to `ApiUnavailableError`. The retries live in `src/core/transient.ts`: `resumeSession` applies them to every PostgREST request, `siteRequest` to the Next.js routes, and supabase-js's own retry handles the token refresh. Output formatting lives in `src/cli/output.ts`: text by default, and with the global `--json` flag stdout carries only the JSON result.
