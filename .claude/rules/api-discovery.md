# API discovery

For the default behaviour of a client library the site uses (supabase-js…), query Context7 before searching the site's JavaScript.

Discover what a feature needs from the API in this order:

1. **Reads**: query the API read-only with `npm run -s api:get -- '<table>?<PostgREST parameters>'`, which only sends `GET` requests. An unknown table name returns PostgREST's suggestion (`Perhaps you meant the table 'public.user_cards'`), `select=*&limit=1` returns the columns, and an embed such as `select=id,user_cards(card_id)` checks a relation.
2. **Writes, RPC functions and Next.js `/api/...` routes**: establish their contract yourself on the account. Chain the existing `wikimasters` commands, and send a direct request for a step no command covers, e.g. put a card up for auction, then try to discard it to see how the discard refuses it. Send it with `npm run -s api:site -- <METHOD> <path> [JSON body]`, which prints the status on stderr and the body on stdout, refusals included. Take a request's name and body from the site's JavaScript, reached through a page's HTML (`npm run -s api:site -- GET /<page>`), or from an existing capture.
   - Before running the sequence, present each write and its effect on the account, and run it once the user agrees.
   - Ask the user for a HAR capture of the manual flow only when neither the site's JavaScript nor an existing capture reveals the request.
   - Once a sequence establishes a contract, align the core, its tests and `docs/api.md` on it in the same increment, without asking.
   - Before proposing a change based on how the site answers, observe that answer on the route the core calls, with `npm run -s api:site`; a page's answer does not stand for an `/api/...` route's.

Record every table and route the core uses in `docs/api.md`, in the commit that makes the core use it.

## HAR captures

Captures stay local in `capture-reseau-har/`, which git ignores, one file per flow named after it (e.g. `withdraw-wishlist.har`). `docs/api.md` is the reference for what the core uses.

- A new capture holds session tokens, cookies and account data. Run `scripts/sanitize-har.sh <file>` on it before reading its content. The script rewrites the file in place, replacing credential headers, cookie values, `/auth/v1/` payloads, JWTs and email addresses with `REDACTED` markers.
- The pre-commit hook refuses any `.har` file.
- When a new kind of secret shows up in a capture, extend `scripts/sanitize-har.sh` rather than editing the capture by hand, then re-run it on every file in `capture-reseau-har/`.
