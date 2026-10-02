#!/usr/bin/env bash
set -euo pipefail

transcript=$(ls ~/.claude/projects/*/"$1".jsonl)

jq -r '
  def clip($n): tostring | gsub("\\s+"; " ") | if length > $n then .[0:$n] + "…" else . end;
  def text_of: if type == "array" then map(select(.type == "text") | .text) | join(" ") else . end;
  (.timestamp // "" | .[11:19]) as $t |
  if .type == "attachment" and .attachment.type == "queued_command" then
    if .attachment.origin.kind == "human" then "\($t) USER (mid-turn): \(.attachment.prompt | text_of | clip(2000))"
    else "\($t) NOTIFICATION: \(.attachment.prompt | text_of | clip(300))"
    end
  elif .type == "user" then
    (.message.content) as $c |
    if .isMeta then "\($t) SKILL LOADED: \($c | text_of | clip(80))"
    elif .origin.kind == "task-notification" then "\($t) NOTIFICATION: \($c | text_of | clip(300))"
    elif ($c | type) == "array" and any($c[]; .type == "tool_result") then
      $c[] | select(.type == "tool_result") |
      "\($t)   RESULT\(if .is_error then " ERROR" else "" end): \(.content | text_of | clip(400))"
    else "\($t) USER: \($c | text_of | clip(2000))"
    end
  elif .type == "assistant" then
    .message.content[]? |
    if .type == "text" then "\($t) AGENT: \(.text | clip(600))"
    elif .type == "tool_use" then
      "\($t)   CALL \(.name): \(.input | (.description // .command // .file_path // .skill // .query // .prompt // .) | clip(300))"
    else empty
    end
  else empty
  end
' "$transcript"
