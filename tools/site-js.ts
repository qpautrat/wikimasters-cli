const CHUNK_PATH = /static\/chunks\/[\w~./-]+\.js(?!\w)/g;
const CONTEXT_LENGTH = 200;

export interface Occurrence {
  file: string;
  offset: number;
  context: string;
}

export function chunkPaths(source: string): string[] {
  return [...new Set(source.match(CHUNK_PATH))];
}

export async function downloadChunks(
  html: string,
  download: (chunkPath: string) => Promise<string>,
): Promise<Map<string, string>> {
  const chunks = new Map<string, string>();
  let pending = chunkPaths(html);
  while (pending.length > 0) {
    const downloaded = await Promise.all(
      pending.map(async (path) => [path, await download(path)] as const),
    );
    for (const [path, source] of downloaded) chunks.set(path, source);
    pending = [
      ...new Set(downloaded.flatMap(([, source]) => chunkPaths(source))),
    ].filter((path) => !chunks.has(path));
  }
  return chunks;
}

export function findOccurrences(
  files: ReadonlyMap<string, string>,
  text: string,
): Occurrence[] {
  const occurrences: Occurrence[] = [];
  for (const [file, source] of files) {
    for (
      let offset = source.indexOf(text);
      offset !== -1;
      offset = source.indexOf(text, offset + text.length)
    ) {
      occurrences.push({
        file,
        offset,
        context: source.slice(
          Math.max(0, offset - CONTEXT_LENGTH),
          offset + text.length + CONTEXT_LENGTH,
        ),
      });
    }
  }
  return occurrences;
}
