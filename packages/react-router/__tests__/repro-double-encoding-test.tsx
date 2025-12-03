import { matchPath, generatePath } from "../index";

describe("Double Encoding Bug Repro", () => {
  it("correctly matches a route with mixed encoded/unencoded params", () => {
    // Expected behavior:
    // URL: /malformed/2%25%200%20g%20-%202
    // Decoded URL path: /malformed/2% 0 g - 2
    // Params: { id: "2% 0 g - 2" }

    // If the browser/history provides the decoded path:
    const pathname = "/malformed/2% 0 g - 2";
    const match = matchPath("/malformed/:id", pathname);

    expect(match).not.toBeNull();
    expect(match?.params.id).toBe("2% 0 g - 2");
  });

  it("correctly generates a path with mixed encoded/unencoded params", () => {
    // Expected behavior:
    // Input: "2% 0 g - 2"
    // Output: "/malformed/2%25%200%20g%20-%202"

    // If we pass a raw string, it should be encoded.
    expect(generatePath("/malformed/:id", { id: "2% 0 g - 2" })).toBe(
      "/malformed/2%25%200%20g%20-%202"
    );

    // If we pass an already encoded string (or partially encoded), it should NOT be double encoded if we use safeEncode?
    // The prompt says: "Prevent re-encoding already-encoded sequences."
    // So if we pass "2%200", it should remain "2%200" (if that was the intent).
    // But "2% 0" should become "2%25%200".

    // The bug report says "Actual: 2%%200%20g%20-%202".
    // This suggests that currently something is producing this wrong value.
  });

  it("does not double-encode already encoded sequences", () => {
    // This is the core of the fix requirement.
    // If I have "%20", it should stay "%20".
    // If I have " ", it should become "%20".

    // Currently generatePath uses encodeURIComponent.
    // encodeURIComponent("%20") -> "%2520".
    // encodeURIComponent(" ") -> "%20".

    // With safeEncode:
    // safeEncode("%20") -> "%20".
    // safeEncode(" ") -> "%20".

    expect(generatePath("/:id", { id: "%20" })).toBe("/%20");
    expect(generatePath("/:id", { id: " " })).toBe("/%20");

    // Mixed: "2% 0" -> "2%25%200"
    expect(generatePath("/:id", { id: "2% 0" })).toBe("/2%25%200");

    // Mixed: "2%200" -> "2%200"
    expect(generatePath("/:id", { id: "2%200" })).toBe("/2%200");
  });
});
