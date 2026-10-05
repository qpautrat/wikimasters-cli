#!/usr/bin/env node
import { openSession, reportFailure } from "../src/cli/session.js";
import { WikiMastersError } from "../src/core/index.js";
import { queryTable } from "../src/core/table-query.js";

const COMMAND = "api:get";

try {
  const [query] = process.argv.slice(2);
  if (!query) {
    throw new WikiMastersError(
      `Usage: npm run -s ${COMMAND} -- '<table>?<PostgREST parameters>'`,
    );
  }
  const rows = await queryTable(await openSession(), query);
  console.log(JSON.stringify(rows, null, 2));
} catch (error) {
  reportFailure(COMMAND, error);
}
