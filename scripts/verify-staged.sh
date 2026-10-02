#!/usr/bin/env bash
set -euo pipefail

snapshot=$(mktemp -d)
trap 'rm -rf "$snapshot"' EXIT

git checkout-index --all --prefix="$snapshot/"
cd "$snapshot"

npm ci --prefer-offline --no-audit --no-fund --loglevel=error

npm run -s typecheck
npm run -s lint
npm run -s format:check
npm test --silent
npm run -s build
