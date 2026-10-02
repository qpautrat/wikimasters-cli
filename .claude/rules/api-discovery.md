# API discovery

Discover what a feature needs from the API in this order:

1. **Reads**: query the API read-only with `npm run -s api:get -- '<table>?<PostgREST parameters>'`, which only sends `GET` requests. An unknown table name returns PostgREST's suggestion (`Perhaps you meant the table 'public.user_cards'`), `select=*&limit=1` returns the columns, and an embed such as `select=id,user_cards(card_id)` checks a relation.
2. **Writes, RPC functions and Next.js `/api/...` routes**: the API reveals neither their name nor their effect. Ask the user for a HAR capture of the manual flow. Never send one of these requests to explore.
3. **Rules computed by the interface**: extract the `static/chunks/*.js` paths from the capture's `_rsc` responses, download them from `https://www.wiki-masters.com/_next/` into the scratchpad, then search them with `grep -o -E '.{0,250}<pattern>.{0,250}'`. The pages themselves redirect to `/login`.

Record every table and route the core uses in `docs/api.md`, in the commit that makes the core use it.

## HAR captures

Captures stay local in `capture-reseau-har/`, which git ignores, one file per flow named after it (e.g. `withdraw-wishlist.har`). `docs/api.md` is the reference for what the core uses.

- A new capture holds session tokens, cookies and account data. Run `scripts/sanitize-har.sh <file>` on it before reading its content. The script rewrites the file in place, replacing credential headers, cookie values, `/auth/v1/` payloads, JWTs and email addresses with `REDACTED` markers.
- The pre-commit hook refuses any `.har` file.
- Read every response of a capture, not only the write's, for the locks and filters the interface applies.
- When a new kind of secret shows up in a capture, extend `scripts/sanitize-har.sh` rather than editing the capture by hand, then re-run it on every file in `capture-reseau-har/`.
