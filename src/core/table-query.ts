import { WikiMastersError, apiFailure } from "./errors.js";
import type { Session } from "./session.js";

const TABLE_NAME = /^[A-Za-z0-9_]+$/;

export async function queryTable(
  session: Session,
  query: string,
): Promise<unknown> {
  const separator = query.indexOf("?");
  const table = separator === -1 ? query : query.slice(0, separator);
  if (!TABLE_NAME.test(table)) {
    throw new WikiMastersError(`Invalid table name "${table}"`);
  }
  const params = new URLSearchParams(
    separator === -1 ? "" : query.slice(separator + 1),
  );

  const builder = session.client.from(table);
  for (const [name, value] of params) {
    if (name !== "select") builder.url.searchParams.append(name, value);
  }
  const { data, error, status } = await builder.select(
    params.get("select") ?? "*",
  );

  if (error) {
    throw apiFailure(
      `Querying ${table}`,
      status,
      [error.message, error.details, error.hint].filter(Boolean).join(" "),
    );
  }
  return data;
}
