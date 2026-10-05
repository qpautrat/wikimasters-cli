import type { PostgrestResponse } from "@supabase/supabase-js";
import { apiFailure } from "./errors.js";

const PAGE_SIZE = 1000;

export async function readAllPages<Row>(
  action: string,
  readPage: (from: number, to: number) => PromiseLike<PostgrestResponse<Row>>,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error, status } = await readPage(from, from + PAGE_SIZE - 1);
    if (error) throw apiFailure(action, status, error.message);
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}
