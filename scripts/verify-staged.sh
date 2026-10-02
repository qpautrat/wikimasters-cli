#!/usr/bin/env bash
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
snapshot=$(mktemp -d)
trap 'rm -rf "$snapshot"' EXIT

git checkout-index --all --prefix="$snapshot/"
cd "$snapshot"

readonly dependency_files=(package.json package-lock.json)
if git -C "$repo_root" diff --quiet -- "${dependency_files[@]}" &&
  git -C "$repo_root" diff --cached --quiet -- "${dependency_files[@]}"; then
  ln -s "$repo_root/node_modules" node_modules
else
  npm ci --silent
fi

npm run -s typecheck
npm run -s lint
npm run -s format:check
npm test --silent
npm run -s build
