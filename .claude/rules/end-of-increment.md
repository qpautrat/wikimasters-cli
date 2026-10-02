# End of increment

## Summary

Report only what the user needs: blockers, questions, and decisions taken on their behalf. Leave out build and hook status, commit mechanics, and the steps taken to satisfy the rules.

## Code review

Run `/code-review` on the increment's commits, `medium` for a batch of fixes, `high` for a feature or new tooling, and fix its valid findings within the same increment, with no new review after. Report its findings only through an improvement proposal, when they reveal a gap that remains.

## Improvement proposals

Once the review fixes are committed, run `/workflow-review` and relay its report as is: a session cost summary, then improvements drawn from what went wrong or was missing during the session, never a review of the delivered work. It reads the session transcript and applies this grid. Two parts, at most two items each:

1. **Project**: a problem or gap met in the code, tools, configs or rules.
2. **Agentic workflow**: a problem in how the agent and the user worked together: round trips, corrections the user had to make, unverified claims, wasted steps, rule breaches.

Each item states the problem observed, its cost, and a concrete proposal the user can accept as is: what to change, and where. Leave out an item without a proposal, and a problem already fixed during the session.

## Session reset

End the summary by asking the user to run `/clear` (alias `/new`), which only the user can run, so the next increment starts from an empty context. Anything that increment needs must already be in the repo or in memory.
