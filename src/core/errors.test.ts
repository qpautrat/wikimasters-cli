import { describe, expect, it } from "vitest";
import { AuthRequiredError, apiFailure } from "./errors.js";

describe("apiFailure", () => {
  it("asks for a new login on HTTP 401 without naming a command", () => {
    const failure = apiFailure("Listing the wishlist", 401, "JWT expired");

    expect(failure).toBeInstanceOf(AuthRequiredError);
    expect(failure.message).toBe(
      "Listing the wishlist was rejected: the session is no longer valid",
    );
  });
});
