# End of increment

## Summary

Report only what the user needs: blockers, questions, and decisions taken on their behalf. Leave out build and hook status, commit mechanics, and the steps taken to satisfy the rules.

## Code review

Run `/mattpocock-skills:code-review` with the increment's first commit's parent as the fixed point, and fix its valid findings within the same increment, with no new review after. A finding that the increment's change leaves stale in another file (README, skill, spec) is fixed in the increment, amending that file's spec in the same commit; only a finding the spec puts out of scope is left unfixed. Report a finding left unfixed in one line of the summary.

## Retrospective

End the summary by offering the user to run `/mattpocock-skills:retro` on the session.

## Next subject

A reply that asks for anything beyond answering the summary's questions opens a new subject. Hand it to a `general-purpose` subagent with a self-contained brief: the request in the user's words, every decision they gave on it, and the repo rules it falls under. The brief tells the subagent to ask, through `SendMessage` to main, before any change that breaks one of its constraints, and to wait for the answer. Relay its questions and results to the user, and send their answers back to it with `SendMessage`. Never ask the user to run `/clear` or to repeat a request.
