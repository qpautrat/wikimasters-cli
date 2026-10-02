#!/usr/bin/env bash
set -euo pipefail

session_id=$1
repo_root=$(cd "$(dirname "$0")/../../../.." && pwd)
transcript=$(ls ~/.claude/projects/*/"$session_id".jsonl)
plugin_skill=$(ls -d ~/.claude/plugins/cache/claude-plugins-official/session-report/*/skills/session-report | tail -1)

# analyze-sessions.mjs walks --dir without following symlinks, so the session is copied, not linked.
copy=$(mktemp -d)
mkdir -p "$copy/session"
cp "$transcript" "$copy/session/"
if [ -d "${transcript%.jsonl}" ]; then cp -R "${transcript%.jsonl}" "$copy/session/"; fi

mise -C "$repo_root" exec -- node "$plugin_skill/analyze-sessions.mjs" --dir "$copy" --json > "$copy/report.json"
rm -rf "$copy/session"
echo "data: $copy/report.json"
echo "session-report skill: $plugin_skill"
