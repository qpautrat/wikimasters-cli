# Reviews

At the end of each increment, without being asked, run two separate reviews and report them separately:

1. **Project review**: code, tools, configs and quality, through `/code-review` on the increment's commits.
2. **Agentic workflow review**: a critical review of how the coding agent and the user worked together: round trips, corrections the user had to make, unverified claims, wasted steps, rule breaches. Each incident states its cost and one actionable fix.

Size the project review to the increment: `/code-review medium` for a batch of fixes, `high` for a feature or new tooling. Fixing the findings of a review closes the same increment: no new review after it.
