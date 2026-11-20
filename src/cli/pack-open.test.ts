import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asEntryId, parseCardId, type Session } from "../core/index.js";

const { openPack, session } = vi.hoisted(() => ({
  openPack: vi.fn(),
  session: {} as Session,
}));

vi.mock("../core/index.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../core/index.js")>()),
  openPack,
}));
vi.mock("./session.js", () => ({ openSession: async () => session }));

const { program } = await import("./program.js");

const cardId = "442b882c-902b-482b-9cd0-12960e2ce93d";
const entryId = "b83a9b2c-9bcd-4ee4-a8ba-59b078e83078";

async function run(...args: string[]): Promise<string[]> {
  const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
  await program.parseAsync(["node", "wikimasters", ...args]);
  const lines = log.mock.calls.map(([line]) => String(line));
  log.mockRestore();
  return lines;
}

describe("wikimasters pack open", () => {
  beforeEach(() => {
    openPack.mockResolvedValue([
      {
        cardId: parseCardId(cardId),
        entryId: asEntryId(entryId),
        title: "1934",
        rarity: "R",
      },
    ]);
  });

  afterEach(() => {
    openPack.mockReset();
    program.setOptionValue("json", undefined);
  });

  it("opens a pack and prints each card with its entry id and card id", async () => {
    const lines = await run("pack", "open");

    expect(openPack).toHaveBeenCalledWith(session);
    expect(lines).toEqual([`${entryId}  ${cardId}  1934 (R)`]);
  });

  it("prints only the list of cards on stdout with --json", async () => {
    const lines = await run("--json", "pack", "open");

    expect(lines.map((line) => JSON.parse(line))).toEqual([
      [{ entryId, cardId, title: "1934", rarity: "R" }],
    ]);
  });
});
