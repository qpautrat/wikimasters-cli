import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import {
  AUTH_COOKIE_NAME,
  SITE_URL,
  WikiMastersError,
  findRefreshTokenInAuthCookieChunks,
  refreshTokenFromAuthCookieChunks,
} from "../core/index.js";

type PasteInput = NodeJS.ReadableStream & { isTTY?: boolean };

const discardedOutput = new Writable({
  write: (_chunk, _encoding, done) => done(),
});

function pasteInstructions(hidden: boolean, platform: NodeJS.Platform): string {
  return [
    ...(platform === "darwin"
      ? [
          "wikimasters login --firefox signs you in through a Firefox window without copying the session.",
        ]
      : []),
    `Sign in to ${SITE_URL}/login in a private browser window.`,
    `Open the developer tools (Storage tab in Firefox, Application tab in Chrome) and copy the value of the ${AUTH_COOKIE_NAME} cookie, or of each of its chunks ${AUTH_COOKIE_NAME}.0, .1…`,
    "Close the private window without logging out, then paste each value here in order and press Enter after each one: the command goes on once the session is complete.",
    ...(hidden ? ["What you paste is not displayed."] : []),
  ].join("\n");
}

export function readPastedLines(
  input: PasteInput,
  onChunk: (chunks: readonly string[], chunk: string) => boolean,
): Promise<string[]> {
  const reader = createInterface({
    input,
    output: discardedOutput,
    terminal: input.isTTY === true,
    historySize: 0,
    crlfDelay: Infinity,
  });
  const lines: string[] = [];
  let ended = false;
  return new Promise((resolve, reject) => {
    reader.on("line", (line) => {
      if (ended) return;
      const value = line.trim();
      if (value !== "") lines.push(value);
      if (value === "" || onChunk(lines, value)) {
        ended = true;
        reader.close();
      }
    });
    reader.on("SIGINT", () => {
      reject(new WikiMastersError("Login cancelled"));
      reader.close();
    });
    reader.on("close", () => resolve(lines));
  });
}

function askForChunk(index: number): void {
  console.error(
    `Paste chunk .${index} and press Enter, or press Enter on an empty line to finish.`,
  );
}

export async function readPastedRefreshToken(
  input: PasteInput = process.stdin,
  platform: NodeJS.Platform = process.platform,
): Promise<string> {
  console.error(pasteInstructions(input.isTTY === true, platform));
  askForChunk(0);
  let refreshToken: string | undefined;
  const chunks = await readPastedLines(input, (received, chunk) => {
    console.error(
      `Received chunk .${received.length - 1}: ${chunk.length} characters.`,
    );
    refreshToken = findRefreshTokenInAuthCookieChunks(received);
    if (refreshToken === undefined) askForChunk(received.length);
    return refreshToken !== undefined;
  });
  return refreshToken ?? refreshTokenFromAuthCookieChunks(chunks);
}
