---
name: workflow-review
description: End-of-increment review of how the session went, read from the real session transcript by a fresh context, with a cost report built by the session-report plugin. Use it at the end of every increment in this repo, as `.claude/rules/end-of-increment.md` requires, and whenever the user asks for a retrospective, a review of the agentic workflow, of the session, or of its cost ("revue du workflow", "rétro", "combien a coûté la session").
context: fork
allowed-tools: Read, Bash(.claude/skills/workflow-review/scripts/*), Bash(cp *), Bash(mkdir -p reports), Edit
---

# Workflow review

You review a session you did not take part in. Your judgment is worth something precisely because you have no memory of it: work only from the transcript, and back every claim with what it shows. The agent who ran the session relays your report to the user as is, so write it in French.

Session under review: `${CLAUDE_SESSION_ID}`. Run every command from the repo root.

## 1. Read the session

```sh
.claude/skills/workflow-review/scripts/session-digest.sh ${CLAUDE_SESSION_ID}
```

It prints one line per event, with its UTC time:

- `USER`: what the user typed. `USER (mid-turn)` was sent while the agent was working, often a correction.
- `AGENT`: what the agent told the user.
- `CALL <tool>` and `RESULT`, `RESULT ERROR`: what the agent did and what came back.
- `SKILL LOADED` and `NOTIFICATION`: content injected by the harness, not written by the user.

Long texts are clipped. When an event matters and its line is clipped, read it in full in `~/.claude/projects/*/${CLAUDE_SESSION_ID}.jsonl` around that time.

## 2. Find what went wrong or was missing

Apply the grid in the **Improvement proposals** section of `.claude/rules/end-of-increment.md`; read it first, it is the reference and may have changed. Then read `CLAUDE.md` and `.claude/rules/*.md`, so you can tell when a rule was breached.

Signals worth chasing in the transcript:

- the user correcting, rephrasing, or asking "pourquoi tu n'as pas…": the agent missed something it could have seen;
- a question the user had to ask that a rule, a doc or the code already answered;
- a claim later retracted, or stated without the check that would have proved it;
- a tool failure, a refused commit, a command retried, a step redone;
- a rule from `CLAUDE.md` or `.claude/rules/` not followed.

Keep an item only when you can name its cost (round trips, a user correction, a wrong result, wasted calls, tokens) and a concrete fix the user can accept as is: what to change, and in which file. Drop a problem the session already fixed; check the later events before keeping one.

## 3. Build the cost report

```sh
.claude/skills/workflow-review/scripts/session-cost-data.sh ${CLAUDE_SESSION_ID}
```

It runs the session-report plugin's analyzer on this session only, and prints where the JSON data landed and where the plugin's skill lives. Read `SKILL.md` in that skill directory, then follow its steps 2 to 4 to build the HTML report, with two differences: the data is the JSON just printed, and the report is saved as `reports/session-<YYYYMMDD-HHMM>.html` (run `mkdir -p reports` first; the folder is gitignored).

From the same data, pick for the summary: total tokens (`overall.input_tokens.total + overall.output_tokens`), the cached share, the number of API calls, the share taken by subagents, and the two most expensive prompts with their share of the total. A cost signal can become a proposal if it points at a waste, such as a skill or subagent out of proportion to what it delivered.

## 4. Report

Reply with exactly this structure, nothing before or after:

```markdown
## Coût de la session

<tokens totaux, part en cache, appels API, part des sous-agents, en une ou deux lignes>
- <prompt le plus coûteux, en quelques mots> : <part du total>
- <deuxième> : <part du total>

Rapport détaillé : `reports/session-<…>.html`

## Propositions d'amélioration

### Projet

1. **<problème, en une phrase>** (<heure> : « <citation courte de la transcription> »). Coût : <…>. Proposition : <quoi changer, et où>.

### Workflow agentique

1. **<problème>** (<heure> : « <citation> »). Coût : <…>. Proposition : <…>.
```

At most two items per part. A part with nothing worth proposing says `Rien à signaler.`; an empty part is a fine result, an invented item is not.
