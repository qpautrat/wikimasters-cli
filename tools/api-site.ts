#!/usr/bin/env node
import { openSession, reportFailure } from "../src/cli/session.js";
import { apiFailure } from "../src/core/errors.js";
import { WikiMastersError } from "../src/core/index.js";
import {
  SITE_METHODS,
  type SiteMethod,
  type SiteSendInit,
  sendSiteRequest,
  siteCookie,
} from "../src/core/site.js";

const COMMAND = "api:site";
const USAGE = `Usage: mise exec -- npm run -s ${COMMAND} -- <${SITE_METHODS.join("|")}> <path> [JSON body]`;

function isSiteMethod(method: string): method is SiteMethod {
  return (SITE_METHODS as readonly string[]).includes(method);
}

function parseRequest(args: readonly string[]): {
  path: string;
  init: SiteSendInit;
} {
  const [method, path, body, ...extra] = args;
  if (!method || !isSiteMethod(method) || !path?.startsWith("/")) {
    throw new WikiMastersError(USAGE);
  }
  if (extra.length > 0) throw new WikiMastersError(USAGE);
  if (body === undefined) return { path, init: { method } };
  if (method === "GET") {
    throw new WikiMastersError("A GET request takes no body");
  }
  try {
    return { path, init: { method, body: JSON.parse(body) } };
  } catch {
    throw new WikiMastersError(`The body is not valid JSON: ${body}`);
  }
}

try {
  const { path, init } = parseRequest(process.argv.slice(2));
  const session = await openSession();
  const action = `${init.method} ${path}`;
  const response = await sendSiteRequest(
    session,
    await siteCookie(session),
    action,
    "/",
    path,
    init,
  );
  console.error(
    response.location === null
      ? `HTTP ${response.status}`
      : `HTTP ${response.status}, redirected to ${response.location}`,
  );
  process.stdout.write(response.body);
  if (response.status === 401) {
    reportFailure(COMMAND, apiFailure(action, response.status, response.body));
  } else if (!response.ok) {
    process.exitCode = 1;
  }
} catch (error) {
  reportFailure(COMMAND, error);
}
