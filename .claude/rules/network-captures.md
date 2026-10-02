# Network captures

HAR captures of the manual WikiMasters flows are versioned in `capture-reseau-har/`, one file per flow named after it (e.g. `withdraw-wishlist.har`), so endpoints can be re-derived without capturing again.

- A new capture holds session tokens, cookies and account data. Run `scripts/sanitize-har.sh <file>` on it before reading its content, and before staging it. The script rewrites the file in place, replacing credential headers, cookie values, `/auth/v1/` payloads, JWTs and email addresses with `REDACTED` markers.
- The pre-commit hook refuses a capture that `scripts/sanitize-har.sh --check` reports as not sanitized; sanitize it and stage it again.
- When a new kind of secret shows up in a capture, extend `scripts/sanitize-har.sh` rather than editing the capture by hand, then re-run it on every file in `capture-reseau-har/`.
