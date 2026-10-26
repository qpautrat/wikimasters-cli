#!/usr/bin/env node
import { claudeAgent } from "./workflow/agent.js";
import { formatSummary, runWorkflow } from "./workflow/engine.js";
import { localRepo } from "./workflow/repo.js";
import { featureWorkflow } from "./workflow/steps.js";

const USAGE =
  "Usage: mise exec -- npm run -s feature:run -- <spec of specs/backlog/, without .md>";

const [spec, ...extra] = process.argv.slice(2);
if (!spec || extra.length > 0) {
  console.error(USAGE);
  process.exit(1);
}

const root = process.cwd();
const repo = localRepo(root);
const agent = claudeAgent(root);
const base = (await repo.run("git", ["rev-parse", "HEAD"])).stdout.trim();
const report = await runWorkflow(
  featureWorkflow({ spec, base, agent, repo }),
  (step) => console.error(`\n▶ ${step.name}`),
);
console.log(formatSummary(report, agent.sessionId));
if (report.blocker !== null) process.exitCode = 1;
