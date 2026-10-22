import { describe, expect, it } from "vitest";
import { chunkPaths, downloadChunks, findOccurrences } from "./site-js.js";

describe("chunkPaths", () => {
  it("keeps each JavaScript chunk once, without its deployment suffix, and skips stylesheets", () => {
    const html = [
      '<script src="/_next/static/chunks/0o9x~z9.js?dpl=dpl_abc"></script>',
      '<link href="/_next/static/chunks/0ci.ba~kz.css?dpl=dpl_abc">',
      '"static/chunks/0o9x~z9.js?dpl=dpl_abc\\"',
    ].join("");
    expect(chunkPaths(html)).toEqual(["static/chunks/0o9x~z9.js"]);
  });
});

describe("downloadChunks", () => {
  it("follows the chunks a downloaded chunk loads on demand, downloading each once", async () => {
    const files: Record<string, string> = {
      "static/chunks/a.js": 'e.l("static/chunks/b.js")',
      "static/chunks/b.js":
        '["static/chunks/a.js","static/chunks/0l~6e-.js"].map(t=>e.l(t))',
      "static/chunks/0l~6e-.js": 'fetch("/api/marketplace",{method:"POST"})',
    };
    const downloaded: string[] = [];
    const chunks = await downloadChunks(
      '<script src="/_next/static/chunks/a.js?dpl=x"></script>',
      async (path) => {
        downloaded.push(path);
        return files[path] ?? "";
      },
    );
    expect(downloaded.sort()).toEqual(Object.keys(files).sort());
    expect(Object.fromEntries(chunks)).toEqual(files);
  });

  it("downloads nothing when the page references no chunk", async () => {
    const chunks = await downloadChunks("<html></html>", async () => {
      throw new Error("no download expected");
    });
    expect(chunks.size).toBe(0);
  });
});

describe("findOccurrences", () => {
  it("finds every case-sensitive occurrence with its offset in each file", () => {
    const files = new Map([
      ["static/chunks/a.js", "api/x API/x api/y"],
      ["static/chunks/b.js", "nothing"],
    ]);
    expect(
      findOccurrences(files, "api/").map(({ file, offset }) => ({
        file,
        offset,
      })),
    ).toEqual([
      { file: "static/chunks/a.js", offset: 0 },
      { file: "static/chunks/a.js", offset: 12 },
    ]);
  });

  it("surrounds an occurrence with the 200 characters before and after it", () => {
    const before = "b".repeat(250);
    const after = "a".repeat(250);
    const [occurrence] = findOccurrences(
      new Map([["static/chunks/a.js", `${before}TEXT${after}`]]),
      "TEXT",
    );
    expect(occurrence?.context).toBe(
      `${"b".repeat(200)}TEXT${"a".repeat(200)}`,
    );
  });

  it("cuts the context at the edges of the file", () => {
    const [occurrence] = findOccurrences(
      new Map([["static/chunks/a.js", "xTEXTy"]]),
      "TEXT",
    );
    expect(occurrence?.context).toBe("xTEXTy");
  });
});
