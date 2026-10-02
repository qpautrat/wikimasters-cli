# End of increment

## Summary

Report only what the user needs: blockers, questions, and decisions taken on their behalf. Leave out build and hook status, commit mechanics, and the steps taken to satisfy the rules.

## Code review

Run `/code-review` on the increment's commits, `medium` for a batch of fixes, `high` for a feature or new tooling, and fix its valid findings within the same increment, with no new review after. Report its findings only through a continuous improvement item, when they reveal a gap that remains.

## Continuous improvement

Run `/workflow-review` in parallel with `/code-review` and relay its report as is: at most one improvement per part, drawn from what went wrong or was missing during the session, never a review of the delivered work:

1. **Code**: a problem or gap met in the code, tools, configs or rules.
2. **Workflow**: a problem in how the agent and the user worked together: round trips, corrections the user had to make, unverified claims, wasted steps, rule breaches.
3. **Cost**: the session's token cost, the turn that cost the most, and a way to spend less.

Each item states the problem observed, its cost, and a concrete proposal the user can accept as is: what to change, and where. Leave out an item without a proposal, and a problem already fixed during the session.

## Session reset

End the summary by asking the user to run `/clear`. Before that, anything the next increment needs is in the repo or in memory.
