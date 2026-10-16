import { PassThrough } from "node:stream";
import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { AUTH_COOKIE_NAME } from "../core/index.js";
import { readPastedLines, readPastedRefreshToken } from "./pasted-session.js";

const encoded = `base64-${Buffer.from(
  JSON.stringify({ refresh_token: "refresh-token" }),
).toString("base64url")}`;
const firstChunk = encoded.slice(0, 20);
const lastChunk = encoded.slice(20);

const never = () => false;

function pasted(text: string): PassThrough {
  const input = new PassThrough();
  input.end(text);
  return input;
}

describe("readPastedLines", () => {
  it("reads one chunk per line until an empty line", async () => {
    expect(await readPastedLines(pasted("a\nb\n\nignored\n"), never)).toEqual([
      "a",
      "b",
    ]);
  });

  it("reads until the end of the input", async () => {
    expect(await readPastedLines(pasted("a\r\n b \r\nc"), never)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("stops as soon as the chunks read are complete", async () => {
    expect(
      await readPastedLines(
        pasted("a\nb\nignored\n"),
        (chunks) => chunks.length === 2,
      ),
    ).toEqual(["a", "b"]);
  });
});

describe("readPastedLines on a terminal", () => {
  function terminal(): PassThrough & { isTTY: true; setRawMode: Mock } {
    return Object.assign(new PassThrough(), {
      isTTY: true as const,
      setRawMode: vi.fn(),
    });
  }

  it("reads the input in raw mode", async () => {
    const input = terminal();
    const lines = readPastedLines(input, never);
    input.write("a\r\r");

    expect(await lines).toEqual(["a"]);
    expect(input.setRawMode).toHaveBeenCalledWith(true);
  });

  it("cancels the login on Ctrl+C", async () => {
    const input = terminal();
    const lines = readPastedLines(input, never);
    input.write("a\u0003");

    await expect(lines).rejects.toThrow("Login cancelled");
  });
});

describe("readPastedRefreshToken", () => {
  afterEach(() => vi.restoreAllMocks());

  function stderrLines(stderr: Mock): string[] {
    return stderr.mock.calls.map(([line]) => String(line));
  }

  it("joins the chunks and explains on stderr where to find them", async () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});

    const refreshToken = await readPastedRefreshToken(
      pasted(`${firstChunk}\n${lastChunk}\n`),
    );

    expect(refreshToken).toBe("refresh-token");
    expect(stderr).toHaveBeenCalledWith(
      expect.stringContaining(`copy the value of the ${AUTH_COOKIE_NAME}`),
    );
  });

  it("stops reading once the chunks hold a refresh token, without an empty line", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const input = new PassThrough();

    const refreshToken = readPastedRefreshToken(input);
    input.write(`${firstChunk}\n${lastChunk}\n`);

    expect(await refreshToken).toBe("refresh-token");
  });

  it("acknowledges each chunk and asks for the next one until the session is complete", async () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});

    await readPastedRefreshToken(pasted(`${firstChunk}\n${lastChunk}\n`));

    expect(stderrLines(stderr).slice(1)).toEqual([
      `Received chunk .0: ${firstChunk.length} characters.`,
      "Paste chunk .1, or an empty line to finish.",
      `Received chunk .1: ${lastChunk.length} characters.`,
    ]);
  });

  it("never echoes the pasted value nor the refresh token", async () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});

    await readPastedRefreshToken(pasted(`${firstChunk}\n${lastChunk}\n`));

    for (const line of stderrLines(stderr)) {
      expect(line).not.toContain(firstChunk);
      expect(line).not.toContain(lastChunk);
      expect(line).not.toContain("refresh-token");
    }
  });

  it.each([
    ["an empty line", "garbage\n\n"],
    ["the end of the input", "garbage"],
  ])("rejects a value without refresh token ended by %s", async (_, text) => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(readPastedRefreshToken(pasted(text))).rejects.toThrow(
      "holds no refresh token",
    );
  });
});
