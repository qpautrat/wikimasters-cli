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

function pasteInstructions(hidden: boolean): string {
  return [
    `Sign in to ${SITE_URL}/login in a private browser window.`,
    `Open the developer tools (Storage tab in Firefox, Application tab in Chrome) and copy the value of the ${AUTH_COOKIE_NAME} cookie, or of each of its chunks ${AUTH_COOKIE_NAME}.0, .1…`,
    "Close the private window without logging out, then paste each value here in order, one per line: the command goes on once the session is complete.",
    ...(hidden ? ["What you paste is not displayed."] : []),
  ].join("\n");
}

export function readPastedLines(
  input: PasteInput,
  isComplete: (chunks: readonly string[]) => boolean,
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
      if (value === "" || isComplete(lines)) {
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

function acknowledgeChunk(chunks: readonly string[]): boolean {
  const index = chunks.length - 1;
  console.error(
    `Received chunk .${index}: ${chunks[index]?.length ?? 0} characters.`,
  );
  const complete = findRefreshTokenInAuthCookieChunks(chunks) !== undefined;
  if (!complete) {
    console.error(`Paste chunk .${chunks.length}, or an empty line to finish.`);
  }
  return complete;
}

export async function readPastedRefreshToken(
  input: PasteInput = process.stdin,
): Promise<string> {
  console.error(pasteInstructions(input.isTTY === true));
  return refreshTokenFromAuthCookieChunks(
    await readPastedLines(input, acknowledgeChunk),
  );
}
