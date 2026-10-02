#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/../../../.." && pwd)
transcript=$(ls ~/.claude/projects/*/"$1".jsonl)

mise -C "$repo_root" exec -- jq -c --arg time "$2" '
  select((.timestamp // "") | .[11:19] == $time) | {type, origin, attachment, message: .message.content}
' "$transcript"
