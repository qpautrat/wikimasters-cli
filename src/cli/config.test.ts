import { mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AuthRequiredError } from "../core/index.js";
import { loadConfig, requireRefreshToken, saveRefreshToken } from "./config.js";

function envFile(content?: string): string {
  const path = join(mkdtempSync(join(tmpdir(), "wikimasters-")), ".env");
  if (content !== undefined) writeFileSync(path, content);
  return path;
}

describe("loadConfig", () => {
  it("reads the anon key and refresh token from the env file", () => {
    const path = envFile(
      "WIKIMASTERS_SUPABASE_ANON_KEY=anon-key\nWIKIMASTERS_REFRESH_TOKEN=stored-token\n",
    );

    expect(loadConfig(path, {})).toEqual({
      anonKey: "anon-key",
      refreshToken: "stored-token",
    });
  });

  it("prefers the env file, which holds the latest rotated token, over the environment", () => {
    const path = envFile(
      "WIKIMASTERS_SUPABASE_ANON_KEY=anon-key\nWIKIMASTERS_REFRESH_TOKEN=rotated\n",
    );

    expect(
      loadConfig(path, { WIKIMASTERS_REFRESH_TOKEN: "stale" }).refreshToken,
    ).toBe("rotated");
  });

  it("falls back to the environment", () => {
    expect(
      loadConfig(envFile(), { WIKIMASTERS_SUPABASE_ANON_KEY: "anon-key" })
        .anonKey,
    ).toBe("anon-key");
  });

  it("leaves the anon key to the core without .env or environment variable", () => {
    expect(loadConfig(envFile(), {})).toEqual({
      anonKey: undefined,
      refreshToken: undefined,
    });
  });

  it("ignores an empty anon key", () => {
    const path = envFile("WIKIMASTERS_SUPABASE_ANON_KEY=\n");

    expect(
      loadConfig(path, { WIKIMASTERS_SUPABASE_ANON_KEY: "" }).anonKey,
    ).toBeUndefined();
    expect(
      loadConfig(path, { WIKIMASTERS_SUPABASE_ANON_KEY: "env-key" }).anonKey,
    ).toBe("env-key");
  });

  it("asks to log in when no refresh token is stored", () => {
    expect(() =>
      requireRefreshToken({ anonKey: "anon-key", refreshToken: undefined }),
    ).toThrow(AuthRequiredError);
    expect(() =>
      requireRefreshToken({ anonKey: "anon-key", refreshToken: undefined }),
    ).toThrow(/^Not logged in$/);
  });
});

describe("saveRefreshToken", () => {
  it("replaces the stored token and keeps the other lines", () => {
    const path = envFile(
      "WIKIMASTERS_SUPABASE_ANON_KEY=anon-key\nWIKIMASTERS_REFRESH_TOKEN=old\n",
    );

    saveRefreshToken("new", path);

    expect(readFileSync(path, "utf8")).toBe(
      "WIKIMASTERS_SUPABASE_ANON_KEY=anon-key\nWIKIMASTERS_REFRESH_TOKEN=new\n",
    );
  });

  it("appends the token when absent and restricts the file to its owner", () => {
    const path = envFile("WIKIMASTERS_SUPABASE_ANON_KEY=anon-key\n");

    saveRefreshToken("new", path);

    expect(readFileSync(path, "utf8")).toBe(
      "WIKIMASTERS_SUPABASE_ANON_KEY=anon-key\nWIKIMASTERS_REFRESH_TOKEN=new\n",
    );
    expect(statSync(path).mode & 0o777).toBe(0o600);
  });
});
