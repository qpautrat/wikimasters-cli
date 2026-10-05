import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiUnavailableError,
  AuthRequiredError,
  WikiMastersError,
} from "../core/index.js";
import { reportFailure } from "./session.js";

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

  it("exits with 4 when a new login is required", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    reportFailure("api:get", new AuthRequiredError("Not logged in"));

    expect(process.exitCode).toBe(4);
  });

  it("exits with 75 when the API stays unavailable", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    reportFailure("wikimasters", new ApiUnavailableError("Unavailable"));

    expect(process.exitCode).toBe(75);
  });
});
