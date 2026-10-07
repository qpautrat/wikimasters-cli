import { PassThrough } from "node:stream";
import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { AUTH_COOKIE_NAME } from "../core/index.js";
import { readPastedLines, readPastedRefreshToken } from "./pasted-session.js";

const encoded = `base64-${Buffer.from(
  JSON.stringify({ refresh_token: "refresh-token" }),
).toString("base64url")}`;

function pasted(text: string): PassThrough {
  const input = new PassThrough();
  input.end(text);
  return input;
}

describe("readPastedLines", () => {
  it("reads one chunk per line until an empty line", async () => {
    expect(await readPastedLines(pasted("a\nb\n\nignored\n"))).toEqual([
      "a",
      "b",
    ]);
  });

  it("reads until the end of the input", async () => {
    expect(await readPastedLines(pasted("a\r\n b \r\nc"))).toEqual([
      "a",
      "b",
      "c",
    ]);
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
    const lines = readPastedLines(input);
    input.write("a\r\r");

    expect(await lines).toEqual(["a"]);
    expect(input.setRawMode).toHaveBeenCalledWith(true);
  });

  it("cancels the login on Ctrl+C", async () => {
    const input = terminal();
    const lines = readPastedLines(input);
    input.write("a\u0003");

    await expect(lines).rejects.toThrow("Login cancelled");
  });
});

describe("readPastedRefreshToken", () => {
  afterEach(() => vi.restoreAllMocks());

  it("joins the chunks and explains on stderr where to find them", async () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});

    const refreshToken = await readPastedRefreshToken(
      pasted(`${encoded.slice(0, 20)}\n${encoded.slice(20)}\n\n`),
    );

    expect(refreshToken).toBe("refresh-token");
    expect(stderr).toHaveBeenCalledWith(
      expect.stringContaining(`copy the value of the ${AUTH_COOKIE_NAME}`),
    );
  });

  it("rejects a value without refresh token", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(readPastedRefreshToken(pasted("garbage\n"))).rejects.toThrow(
      "holds no refresh token",
    );
  });
});
