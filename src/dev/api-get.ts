#!/usr/bin/env node
import { openSession, reportFailure } from "../cli/session.js";
import { WikiMastersError } from "../core/index.js";
import { queryTable } from "../core/table-query.js";

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
