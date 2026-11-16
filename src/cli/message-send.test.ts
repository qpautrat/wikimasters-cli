import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asMessageId, asPlayerId, type Session } from "../core/index.js";

const { sendMessage, session } = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  session: {} as Session,
}));

vi.mock("../core/index.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../core/index.js")>()),
  sendMessage,
}));
vi.mock("./session.js", () => ({ openSession: async () => session }));

const { program } = await import("./program.js");

const playerId = "37fe4f31-003f-40c1-9eb6-1f39e0947037";
const messageId = "f9774a20-e48b-4b85-97e7-fff435001dd1";

async function run(...args: string[]): Promise<string[]> {
  const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
  await program.parseAsync(["node", "wikimasters", ...args]);
  const lines = log.mock.calls.map(([line]) => String(line));
  log.mockRestore();
  return lines;
}

describe("wikimasters message send", () => {
  beforeEach(() => {
    sendMessage.mockResolvedValue({ messageId: asMessageId(messageId) });
  });

  afterEach(() => {
    sendMessage.mockReset();
    program.setOptionValue("json", undefined);
  });

  it("sends the text as given to the player and prints the message id", async () => {
    const lines = await run("message", "send", playerId, "  Hello  ");

    expect(sendMessage).toHaveBeenCalledWith(
      session,
      asPlayerId(playerId),
      "  Hello  ",
    );
    expect(lines).toEqual([`Message ${messageId} sent.`]);
  });

  it("prints only the messageId on stdout with --json", async () => {
    const lines = await run("--json", "message", "send", playerId, "Hello");

    expect(lines.map((line) => JSON.parse(line))).toEqual([{ messageId }]);
  });
});
