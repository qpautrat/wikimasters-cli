#!/usr/bin/env bash
set -euo pipefail

previous=$(git describe --tags --abbrev=0 --match 'v*')
subjects=$(git log --format=%s "$previous"..HEAD)
bodies=$(git log --format=%b "$previous"..HEAD)
scope='(\([^)]*\))?'

if grep -Eq "^[a-z]+$scope!:" <<<"$subjects" || grep -Eq '^BREAKING[ -]CHANGE:' <<<"$bodies"; then
  bump=major
elif grep -Eq "^feat$scope:" <<<"$subjects"; then
  bump=minor
elif grep -Eq "^(fix|perf)$scope:" <<<"$subjects"; then
  bump=patch
else
  echo "no feat, fix, perf or breaking change since $previous: nothing to publish" >&2
  exit 0
fi

npm version "$bump" -m "chore: bump the version to %s"
tag="v$(jq -r .version package.json)"
npm publish
git push --atomic origin HEAD "refs/tags/$tag"
