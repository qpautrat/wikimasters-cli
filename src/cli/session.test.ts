import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiUnavailableError,
  AuthRequiredError,
  WikiMastersError,
} from "../core/index.js";
import { packageRoot } from "./config.js";
import { loginCommand, reportFailure } from "./session.js";

describe("reportFailure", () => {
  afterEach(() => {
    process.exitCode = undefined;
    vi.restoreAllMocks();
  });

  it("prints the message on stderr and exits with 1", () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});

    reportFailure("wikimasters", new WikiMastersError("Listing failed"));

    expect(stderr).toHaveBeenCalledWith("wikimasters: Listing failed");
    expect(process.exitCode).toBe(1);
  });

  it("exits with 4 and gives the login command when a new login is required", () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});

    reportFailure("api:get", new AuthRequiredError("Not logged in"));

    expect(stderr).toHaveBeenCalledWith(
      `api:get: Not logged in: run \`mise -C '${packageRoot()}' run wikimasters -- login\``,
    );
    expect(process.exitCode).toBe(4);
  });

  it("exits with 75 when the API stays unavailable", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    reportFailure("wikimasters", new ApiUnavailableError("Unavailable"));

    expect(process.exitCode).toBe(75);
  });
});

describe("loginCommand", () => {
  it("quotes the repository root for the shell", () => {
    expect(loginCommand("/Users/me/My Games/it's-cli")).toBe(
      "mise -C '/Users/me/My Games/it'\\''s-cli' run wikimasters -- login",
    );
  });
});
