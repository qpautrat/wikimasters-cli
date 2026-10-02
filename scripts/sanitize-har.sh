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
  def redact_header: if (.name | ascii_downcase | IN("authorization", "cookie", "set-cookie", "apikey", "x-api-key")) then .value = "REDACTED" else . end;

  .log.entries[] |= (
      (.request.headers[]?, .response.headers[]?) |= redact_header
    | (.request.cookies[]?, .response.cookies[]?).value |= "REDACTED"
    | if (.request.url | test("/auth/v1/")) then
        (.request.postData.text, .response.content.text | select(. != null)) |= "REDACTED"
      else . end
  )
  | walk(if type == "string" then
      gsub("eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]*"; "REDACTED_JWT")
      | gsub("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"; "REDACTED_EMAIL")
    else . end)
'

if $check; then
  status=0
  for har in "$@"; do
    if ! jq -e "($FILTER) == ." "$har" > /dev/null; then
      echo "not sanitized or not a HAR: $har (run $0 $har)" >&2
      status=1
    fi
  done
  exit "$status"
fi

for har in "$@"; do
  tmp="$(mktemp)"
  jq "$FILTER" "$har" > "$tmp"
  mv "$tmp" "$har"
  echo "sanitized: $har"
done
