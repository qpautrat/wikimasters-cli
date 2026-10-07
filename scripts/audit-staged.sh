#!/usr/bin/env bash
set -euo pipefail

snapshot=$(mktemp -d)
trap 'rm -rf "$snapshot"' EXIT

git show :package.json >"$snapshot/package.json"
git show :package-lock.json >"$snapshot/package-lock.json"
cd "$snapshot"

report=$(npm audit --omit=dev --json --offline=false --fetch-timeout=10000 --fetch-retries=0 2>npm-stderr) || true

if jq -e 'has("vulnerabilities")' <<<"$report" >/dev/null 2>&1; then
  vulnerable=$(jq -r '.vulnerabilities[] | "  \(.name): \(.severity)"' <<<"$report")
  if [[ -n $vulnerable ]]; then
    echo "production dependencies have known vulnerabilities:" >&2
    echo "$vulnerable" >&2
    exit 1
  fi
elif grep -q "audit endpoint returned an error" npm-stderr; then
  echo "warning: npm registry unreachable, dependency audit skipped: $(jq -r .message <<<"$report" 2>/dev/null)" >&2
else
  echo "npm audit failed:" >&2
  cat npm-stderr >&2
  echo "$report" >&2
  exit 1
fi
