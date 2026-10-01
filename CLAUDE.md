# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`wkm-cli` lets an AI agent interact with [WikiMasters](https://www.wiki-masters.com), a collectible card game built from Wikipedia articles (packs, collection, duels, trades, auctions, guilds, messaging). The site has no public API: this project wraps the internal HTTP API used by its web front-end.

That front-end is a Next.js app whose data layer is Supabase: the browser calls PostgREST directly at `https://cyrxjeppjqsxxjayfrur.supabase.co/rest/v1/<table>` with the user's session JWT. A few routes go through the Next.js server instead (`https://www.wiki-masters.com/api/...`). Endpoints are discovered from HAR captures of the manual flows, stored sanitized in `capture-reseau-har/`.

## Stack and commands

TypeScript (ESM, `nodenext`) on Node ≥ 22.12, `@supabase/supabase-js` for auth and PostgREST, `commander` for the CLI, Vitest for tests.

| Task | Command |
|---|---|
| Build to `dist/` | `npm run build` |
| Typecheck | `npm run typecheck` |
| All tests | `npm test` |
| One test file / one test | `npx vitest run src/core/wishlist.test.ts` / `npx vitest run -t "already absent"` |
| Run the CLI after a build | `npm run -s wkm -- login`, then `npm run -s wkm -- wishlist remove <card-uuid>` |

Tests sit next to the code as `*.test.ts` and never hit the network: they pass a fake `fetch` from `src/core/testing/fake-supabase.ts` to `resumeSession`, which simulates Supabase's auth and PostgREST responses. Test files and `testing/` are excluded from the build, so `npm run typecheck` does not cover them.

Supabase auth on this project requires a captcha, so there is no password sign-in: `wkm login` starts the installed Firefox, unautomated, on a throwaway profile; the user signs in there, and the CLI reads the refresh token from the `sb-<ref>-auth-token` cookies in the profile's `cookies.sqlite` (through the `sqlite3` CLI), then closes Firefox and deletes the profile. A browser driven by Playwright/WebDriver fails the captcha. Every command then exchanges that refresh token for a session. Supabase rotates refresh tokens on each use, so the CLI writes the new one back to `.env` right after the exchange, before doing anything else. Never solve the captcha programmatically or hide browser automation from it.

The CLI reads `WKM_SUPABASE_ANON_KEY` (the site's public Supabase key, found in its JavaScript bundle) and `WKM_REFRESH_TOKEN` (managed by `wkm login`) from `.env` at the repo root, falling back to the environment. The file wins because it holds the latest rotated token. `.env` is gitignored; the template is `.env.example`. Never print the refresh token.

## Architecture

Two layers, kept strictly separate:

1. **Core client** (`src/core/`, public surface in `index.ts`): a typed wrapper over WikiMasters' internal HTTP endpoints, covering session/auth, requests and parsing responses into domain types. It is the only place that knows endpoint URLs and payload shapes, so a change on the site is fixed in one spot. It does no terminal output and no argument parsing.
2. **Adapters** (`src/cli/`): thin consumers of the core that map input to core calls and format output, with no business logic. The CLI (`wkm`) is the only adapter in scope. An MCP server is planned and must reuse the core unchanged.

A feature lands in the core first, then gets exposed through the CLI. Core failures throw `WikiMastersError`; the CLI prints its message to stderr and exits 1, or 4 for its `AuthRequiredError` subclass (no session, refresh token expired or revoked, HTTP 401), which tells the agent to run `wkm login`. Build API errors with `apiFailure` so a 401 maps to `AuthRequiredError`. Output formatting lives in `src/cli/output.ts`: text by default, and with the global `--json` flag stdout carries only the JSON result.

## Specification-driven workflow

The user states requirements as user-facing specs in `specs/`, one Markdown file per feature (context, user stories, acceptance criteria). Implement from the acceptance criteria. When a spec is ambiguous or conflicts with existing code, ask instead of guessing.
