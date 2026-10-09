#!/usr/bin/env bash
set -euo pipefail

refused=$(
  git diff --cached --no-color --no-ext-diff --unified=0 -- CLAUDE.md .claude specs |
    awk '
      /^\+\+\+ / { file = substr($0, 7); next }
      /^@@ / { split($3, range, ","); line = substr(range[1], 2) + 0; next }
      /^\+/ {
        if (index(tolower($0), "claude.local") > 0) printf "  %s:%d: %s\n", file, line, substr($0, 2)
        line++
      }
    '
)

if [[ -n $refused ]]; then
  echo "CLAUDE.md, .claude/ and specs/ never reference the player's untracked local instructions file:" >&2
  echo "$refused" >&2
  exit 1
fi
