# API discovery

Discover what a feature needs from the API in this order:

1. **Reads**: query the API read-only from a scratch script outside the repo. Run `npm run build` first, then import from `dist/`: read the config with `loadConfig`, open the session with `resumeSession`, and save the rotated refresh token with `saveRefreshToken` right after, before any query. Besides that token exchange, send only `GET` or `HEAD` requests, and never print the refresh token. An unknown table name returns PostgREST's suggestion (`Perhaps you meant the table 'public.user_cards'`), `select=*&limit=1` returns the columns, and an embed such as `cards(user_cards(card_id))` checks a relation.
2. **Writes, RPC functions and Next.js `/api/...` routes**: the API reveals neither their name nor their effect. Ask the user for a HAR capture of the manual flow. Never send one of these requests to explore.

Record every table and route the core uses in `docs/api.md`, in the commit that makes the core use it.

## HAR captures

Captures are versioned in `capture-reseau-har/`, one file per flow named after it (e.g. `withdraw-wishlist.har`), so endpoints can be re-derived without capturing again.

- A new capture holds session tokens, cookies and account data. Run `scripts/sanitize-har.sh <file>` on it before reading its content, and before staging it. The script rewrites the file in place, replacing credential headers, cookie values, `/auth/v1/` payloads, JWTs and email addresses with `REDACTED` markers.
- The pre-commit hook refuses a capture that `scripts/sanitize-har.sh --check` reports as not sanitized; sanitize it and stage it again.
- When a new kind of secret shows up in a capture, extend `scripts/sanitize-har.sh` rather than editing the capture by hand, then re-run it on every file in `capture-reseau-har/`.
