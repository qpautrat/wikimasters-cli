#!/usr/bin/env bash
set -euo pipefail

check=false
if [[ ${1:-} == --check ]]; then
  check=true
  shift
fi

if [[ $# -eq 0 ]]; then
  echo "usage: $0 [--check] <file.har>..." >&2
  exit 64
fi

readonly FILTER='
  def redact_headers: map(if (.name | ascii_downcase | IN("authorization", "cookie", "set-cookie", "apikey", "x-api-key")) then .value = "REDACTED" else . end);
  def redact_cookies: map(.value = "REDACTED");

  .log.entries[] |= (
      .request.headers |= redact_headers
    | .response.headers |= redact_headers
    | .request.cookies |= redact_cookies
    | .response.cookies |= redact_cookies
    | if (.request.url | test("/auth/v1/")) then
        (.request.postData.text? |= (if . == null then null else "REDACTED" end))
        | (.response.content.text? |= (if . == null then null else "REDACTED" end))
      else . end
  )
  | walk(if type == "string" then
      gsub("eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]*"; "REDACTED_JWT")
      | gsub("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"; "REDACTED_EMAIL")
    else . end)
'

if $check; then
  unsanitized=0
  for har in "$@"; do
    if ! cmp -s <(jq -S "$FILTER" "$har") <(jq -S . "$har"); then
      echo "not sanitized: $har (run $0 $har)" >&2
      unsanitized=1
    fi
  done
  exit "$unsanitized"
fi

for har in "$@"; do
  tmp="$(mktemp)"
  jq "$FILTER" "$har" > "$tmp"
  mv "$tmp" "$har"
  echo "sanitized: $har"
done
