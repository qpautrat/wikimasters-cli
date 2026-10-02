#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/../../../.." && pwd)
transcript=$(ls ~/.claude/projects/*/"$1".jsonl)
digest="${transcript%.jsonl}/workflow-review-digest.txt"
mkdir -p "${transcript%.jsonl}"

mise -C "$repo_root" exec -- jq -r '
  def clip($n): tostring | gsub("\\s+"; " ") | if length > $n then .[0:$n] + "…" else . end;
  def text_of: if type == "array" then map(select(.type == "text") | .text) | join(" ") else . end;
  (.timestamp // "" | .[11:19]) as $t |
  if .type == "attachment" and .attachment.type == "queued_command" then
    if .attachment.origin.kind == "human" then "\($t) USER (mid-turn): \(.attachment.prompt | text_of | clip(1000))"
    else "\($t) NOTIFICATION: \(.attachment.prompt | text_of | clip(200))"
    end
  elif .type == "user" then
    (.message.content) as $c |
    if .isCompactSummary then "\($t) COMPACTION SUMMARY: \($c | text_of | clip(80))"
    elif .isMeta then "\($t) INJECTED: \($c | text_of | clip(80))"
    elif .origin.kind == "task-notification" then "\($t) NOTIFICATION: \($c | text_of | clip(200))"
    elif ($c | type) == "array" and any($c[]; .type == "tool_result") then
      $c[] | select(.type == "tool_result") |
      "\($t)   RESULT\(if .is_error then " ERROR" else "" end): \(.content | text_of | clip(200))"
    else "\($t) USER: \($c | text_of | clip(1000))"
    end
  elif .type == "assistant" then
    .message.content[]? |
    if .type == "text" then "\($t) AGENT: \(.text | clip(300))"
    elif .type == "tool_use" then
      "\($t)   CALL \(.name): \(.input | (.description // .command // .file_path // .skill // .query // .prompt // .) | clip(150))"
    else empty
    end
  else empty
  end
' "$transcript" > "$digest"
echo "$digest"
