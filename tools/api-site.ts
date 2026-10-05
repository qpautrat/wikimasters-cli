#!/usr/bin/env node
import { openSession, reportFailure } from "../src/cli/session.js";
import { AuthRequiredError, WikiMastersError } from "../src/core/index.js";
import {
  SITE_METHODS,
  type SiteMethod,
  type SiteSendInit,
  sendSiteRequest,
  siteCookie,
  siteFailure,
} from "../src/core/site.js";

const COMMAND = "api:site";
const USAGE = `Usage: npm run -s ${COMMAND} -- <${SITE_METHODS.join("|")}> <path> [JSON body]`;

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
  if (!response.ok) {
    const failure = siteFailure(action, response);
    if (failure instanceof AuthRequiredError) reportFailure(COMMAND, failure);
    else process.exitCode = 1;
  }
} catch (error) {
  reportFailure(COMMAND, error);
}
