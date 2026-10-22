#!/usr/bin/env node
import { openSession, reportFailure } from "../src/cli/session.js";
import {
  AuthRequiredError,
  SITE_URL,
  type Session,
  WikiMastersError,
} from "../src/core/index.js";
import { sendSiteRequest, siteCookie } from "../src/core/site.js";
import { downloadChunks, findOccurrences } from "./site-js.js";

const COMMAND = "api:js";
const USAGE = `Usage: mise exec -- npm run -s ${COMMAND} -- <page path> <text>`;

function parseSearch(args: readonly string[]): { page: string; text: string } {
  const [page, text, ...extra] = args;
  if (!page?.startsWith("/") || !text || extra.length > 0) {
    throw new WikiMastersError(USAGE);
  }
  return { page, text };
}

async function downloadSiteFile(
  session: Session,
  cookie: string,
  page: string,
  path: string,
): Promise<string> {
  const action = `GET ${SITE_URL}${path}`;
  const response = await sendSiteRequest(session, cookie, action, page, path, {
    method: "GET",
  });
  if (response.ok) return response.body;
  const failure = `${action} failed (HTTP ${response.status})`;
  throw response.status === 401
    ? new AuthRequiredError(failure)
    : new WikiMastersError(failure);
}

try {
  const { page, text } = parseSearch(process.argv.slice(2));
  const session = await openSession();
  const cookie = await siteCookie(session);
  const download = (path: string) =>
    downloadSiteFile(session, cookie, page, path);
  const html = await download(page);
  const chunks = await downloadChunks(html, (chunkPath) =>
    download(`/_next/${chunkPath}`),
  );
  const files = new Map([[page, html], ...chunks]);
  const occurrences = findOccurrences(files, text);
  if (occurrences.length === 0) {
    throw new WikiMastersError(
      `${JSON.stringify(text)} is not in the ${files.size} files of ${page}`,
    );
  }
  for (const { file, offset, context } of occurrences) {
    process.stdout.write(`${file} at offset ${offset}\n${context}\n\n`);
  }
} catch (error) {
  reportFailure(COMMAND, error);
}
