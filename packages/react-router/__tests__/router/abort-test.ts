import { isAbortError } from "../../lib/router/abort";

describe("isAbortError", () => {
  function activeSignal(): AbortSignal {
    return new AbortController().signal;
  }

  function abortedSignal(reason?: unknown): AbortSignal {
    let controller = new AbortController();
    if (typeof reason === "undefined") {
      controller.abort();
    } else {
      controller.abort(reason);
    }
    return controller.signal;
  }

  it("returns true when the signal is already aborted, regardless of error", () => {
    expect(isAbortError(new Error("unrelated"), abortedSignal())).toBe(true);
    expect(isAbortError(undefined, abortedSignal())).toBe(true);
    expect(isAbortError("string", abortedSignal())).toBe(true);
  });

  it("returns true for a DOMException named AbortError on an active signal", () => {
    let error = new DOMException("Aborted", "AbortError");
    expect(isAbortError(error, activeSignal())).toBe(true);
  });

  it("returns true for an Error named AbortError on an active signal", () => {
    let error = new Error("Aborted");
    error.name = "AbortError";
    expect(isAbortError(error, activeSignal())).toBe(true);
  });

  describe("TypeError fallback", () => {
    let messages = [
      "Failed to fetch",
      "load failed",
      "Network request failed",
      "The operation was aborted",
    ];

    it("matches common browser abort messages when allowTypeError is true", () => {
      for (let message of messages) {
        expect(
          isAbortError(new TypeError(message), activeSignal(), {
            allowTypeError: true,
          }),
        ).toBe(true);
      }
    });

    it("is permissive by default (allowTypeError defaults to true)", () => {
      expect(isAbortError(new TypeError("Failed to fetch"), activeSignal())).toBe(
        true,
      );
    });

    it("rejects matching TypeErrors when allowTypeError is false", () => {
      expect(
        isAbortError(new TypeError("Failed to fetch"), activeSignal(), {
          allowTypeError: false,
        }),
      ).toBe(false);
    });

    it("does not match unrelated TypeError messages", () => {
      expect(
        isAbortError(
          new TypeError("Cannot read properties of undefined"),
          activeSignal(),
          { allowTypeError: true },
        ),
      ).toBe(false);
    });
  });

  it("returns false for non-abort Error subclasses on an active signal", () => {
    expect(isAbortError(new RangeError("oops"), activeSignal())).toBe(false);
    expect(isAbortError(new Error("regular"), activeSignal())).toBe(false);
  });

  it("returns false for non-Error values on an active signal", () => {
    expect(isAbortError("Aborted", activeSignal())).toBe(false);
    expect(isAbortError(null, activeSignal())).toBe(false);
    expect(isAbortError({ name: "AbortError" }, activeSignal())).toBe(false);
  });
});
