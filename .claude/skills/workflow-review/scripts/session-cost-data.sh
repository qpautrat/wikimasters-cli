#!/usr/bin/env bash
set -euo pipefail

session_id=$1
repo_root=$(cd "$(dirname "$0")/../../../.." && pwd)
transcript=$(ls ~/.claude/projects/*/"$session_id".jsonl)
plugin_root=$(mise -C "$repo_root" exec -- jq -r --arg project "$repo_root" '
  .plugins["session-report@claude-plugins-official"][] | select(.projectPath == $project) | .installPath
' ~/.claude/plugins/installed_plugins.json)

copy=$(mktemp -d)
trap 'rm -rf "$copy"' EXIT

# analyze-sessions.mjs walks --dir without following symlinks.
mkdir -p "$copy/session"
cp "$transcript" "$copy/session/"
if [ -d "${transcript%.jsonl}" ]; then cp -R "${transcript%.jsonl}" "$copy/session/"; fi

mise -C "$repo_root" exec -- node "$plugin_root/skills/session-report/analyze-sessions.mjs" --dir "$copy" --json > "$copy/report.json"
mise -C "$repo_root" exec -- jq -r '
  (.overall.input_tokens.total + .overall.output_tokens) as $total |
  "total_tokens: \($total)",
  "cached_input_pct: \(.overall.input_tokens.pct_cached)",
  "api_calls: \(.overall.api_calls)",
  "subagent_tokens_pct: \(if $total > 0 then (.overall.subagent.total_tokens * 1000 / $total | round / 10) else 0 end)",
  (.top_prompts[0:3][] | "top_prompt: \(.total_tokens * 1000 / $total | round / 10)% at \(.ts[11:19]): \(.text | gsub("\\s+"; " ") | .[0:100])")
' "$copy/report.json"
