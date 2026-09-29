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
| Run the CLI after a build | `npm run -s wkm -- wishlist remove <card-uuid>` |

Tests sit next to the code as `*.test.ts` and never hit the network: they pass a fake `fetch` from `src/core/testing/fake-supabase.ts` to `signIn`, which simulates Supabase's auth and PostgREST responses. Test files and `testing/` are excluded from the build, so `npm run typecheck` does not cover them.

The CLI reads `WKM_EMAIL`, `WKM_PASSWORD` and `WKM_SUPABASE_ANON_KEY` from the environment, falling back to `.env` at the repo root (gitignored; template in `.env.example`). The anon key is the site's public Supabase key, found in its JavaScript bundle. Never read or print the password.

## Architecture

Two layers, kept strictly separate:

1. **Core client** (`src/core/`, public surface in `index.ts`): a typed wrapper over WikiMasters' internal HTTP endpoints, covering session/auth, requests and parsing responses into domain types. It is the only place that knows endpoint URLs and payload shapes, so a change on the site is fixed in one spot. It does no terminal output and no argument parsing.
2. **Adapters** (`src/cli/`): thin consumers of the core that map input to core calls and format output, with no business logic. The CLI (`wkm`) is the only adapter in scope. An MCP server is planned and must reuse the core unchanged.

A feature lands in the core first, then gets exposed through the CLI. Core failures throw `WikiMastersError`; the CLI prints its message to stderr and exits 1.

## Specification-driven workflow

The user states requirements as user-facing specs in `specs/`, one Markdown file per feature (context, user stories, acceptance criteria). Implement from the acceptance criteria. When a spec is ambiguous or conflicts with existing code, ask instead of guessing.
