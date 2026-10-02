#!/usr/bin/env bash
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
snapshot=$(mktemp -d)
trap 'rm -rf "$snapshot"' EXIT

git checkout-index --all --prefix="$snapshot/"
ln -s "$repo_root/node_modules" "$snapshot/node_modules"
cd "$snapshot"

npm run -s typecheck
npm run -s lint
npm run -s format:check
npm test --silent
npm run -s build
