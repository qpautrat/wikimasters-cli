---
name: workflow-review
description: Light end-of-increment continuous-improvement review of the session, on the code, the agentic workflow and the token cost, read from the real session transcript by a fresh context, with token figures from the session-report plugin's analyzer. Use it at the end of every increment in this repo, as `.claude/rules/end-of-increment.md` requires, and whenever the user asks for a retrospective, a review of the workflow, of the session, or of its cost ("revue du workflow", "rétro", "combien a coûté la session").
context: fork
allowed-tools: Read, Bash(.claude/skills/workflow-review/scripts/*)
---

# Workflow review

Review a session you did not take part in, from its transcript only, and back every claim with what it shows. Keep the report to a few lines, in French: it is relayed to the user as is.

Session under review: `${CLAUDE_SESSION_ID}`. Run every command from the repo root.

## 1. Read the session

```sh
.claude/skills/workflow-review/scripts/session-digest.sh ${CLAUDE_SESSION_ID}
```

It writes the session's digest to a file and prints its path; Read that file. One line per event, with its UTC time:

- `USER`: what the user typed. `USER (mid-turn)` was sent while the agent was working, often a correction.
- `AGENT`: what the agent told the user.
- `CALL <tool>` and `RESULT`, `RESULT ERROR`: what the agent did and what came back.
- `INJECTED` and `NOTIFICATION`: content inserted by the harness, not written by the user.
- `COMPACTION SUMMARY`: the harness's summary of earlier context.

Long texts are clipped. To read an event in full, run `.claude/skills/workflow-review/scripts/session-event.sh ${CLAUDE_SESSION_ID} <HH:MM:SS>`.

## 2. Measure the cost

```sh
.claude/skills/workflow-review/scripts/session-cost-data.sh ${CLAUDE_SESSION_ID}
```

It runs the session-report plugin's analyzer on this session only and prints the figures: total tokens, cached input share, API calls, subagents' share, and the three most expensive turns with their share and the prompt that opened them.

## 3. Pick at most one improvement per part

Apply the grid in the **Continuous improvement** section of `.claude/rules/end-of-increment.md`; read it first, it is the reference. Read `CLAUDE.md` and `.claude/rules/*.md` too, so you can tell when a rule was breached.

Signals worth chasing in the transcript:

- the user correcting, rephrasing, or asking "pourquoi tu n'as pas…": the agent missed something it could have seen;
- a claim later retracted, or stated without the check that would have proved it;
- a tool failure, a refused commit, a command retried, a step redone;
- a rule not followed;
- for the cost: a turn, a skill or a subagent out of proportion to what it delivered, or a large file or skill loaded into the context and then re-read by every later call.

For each part, keep the single item with the highest cost, and only if you can name that cost and a concrete fix the user can accept as is: what to change, and in which file. Drop a problem the session already fixed, and a proposal the user already declined in it; check the later events before keeping one.

## 4. Report

Reply with exactly this structure, nothing before or after, one or two sentences per item:

```markdown
## Amélioration continue

- **Code** : <problème> (<heure> : « <citation courte> »). Coût : <…>. Proposition : <quoi changer, et où>.
- **Workflow** : <problème> (<heure> : « <citation> »). Coût : <…>. Proposition : <…>.
- **Coût** : <N> M tokens, <x> % en cache, <n> appels ; le tour le plus coûteux, « <prompt en quelques mots> », en prend <p> %. Proposition : <comment dépenser moins, et où>.
```

Leave out the Code or Workflow line when it has nothing worth proposing, and the cost `Proposition` when there is none; the cost figures always stay. Never invent an item.
