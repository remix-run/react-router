import {
  FOG_OF_WAR_TIMEOUT_MS,
  fetchAndApplyManifestPatches,
  getPathsWithAncestors,
} from "../../../lib/dom/ssr/fog-of-war";
import type { AssetsManifest } from "../../../lib/dom/ssr/entry";

describe("fog of war", () => {
  describe("getPathsWithAncestors", () => {
    test("adds parent paths", () => {
      expect(getPathsWithAncestors(["/a/b/c"])).toEqual([
        "/a",
        "/a/b",
        "/a/b/c",
      ]);
    });

    test("dedupes shared parent paths", () => {
      expect(getPathsWithAncestors(["/a/b", "/a/c"])).toEqual([
        "/a",
        "/a/b",
        "/a/c",
      ]);
    });

    test("normalizes paths without leading slashes", () => {
      expect(getPathsWithAncestors(["a/b"])).toEqual(["/a", "/a/b"]);
    });
  });

  describe("fetchAndApplyManifestPatches discovery timeout", () => {
    let originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
      jest.useRealTimers();
    });

    function manifest(): AssetsManifest {
      return {
        entry: { imports: [], module: "" },
        routes: {},
        url: "",
        version: "test",
      };
    }

    function callFetchAndApply(signal?: AbortSignal) {
      return fetchAndApplyManifestPatches(
        ["/a"],
        null,
        manifest(),
        {},
        true,
        false,
        undefined,
        "/__manifest",
        () => {},
        signal,
      );
    }

    test("a manifest request that never settles rejects after the timeout instead of hanging", async () => {
      jest.useFakeTimers();
      // A fetch that never resolves and never rejects on its own — but a real
      // fetch aborts when its signal fires, and the timeout composition relies
      // on that, so the stub honors the signal.
      global.fetch = ((_url: any, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(
              Object.assign(new Error("aborted"), { name: "AbortError" }),
            ),
          );
        })) as typeof fetch;

      let result = callFetchAndApply();
      // Prevent an unhandled rejection between timer flush and assertion.
      let outcome = result.then(
        () => "resolved",
        (e: unknown) => e,
      );

      await jest.advanceTimersByTimeAsync(FOG_OF_WAR_TIMEOUT_MS + 1);

      let error = await outcome;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/timed out after/);
    });

    test("a caller abort still resolves silently (no error) before the timeout", async () => {
      jest.useFakeTimers();
      global.fetch = ((_url: any, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(
              Object.assign(new Error("aborted"), { name: "AbortError" }),
            ),
          );
        })) as typeof fetch;

      let controller = new AbortController();
      let result = callFetchAndApply(controller.signal);
      controller.abort();

      await expect(result).resolves.toBeUndefined();
    });

    test("a fast response is unaffected and the timeout timer is cleaned up", async () => {
      jest.useFakeTimers();
      // Minimal response stub: a real undici Response interacts badly with
      // fake timers (unbounded microtask/timer churn), and only these fields
      // are read by fetchAndApplyManifestPatches.
      global.fetch = (() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({}),
        } as unknown as Response)) as typeof fetch;

      await expect(callFetchAndApply()).resolves.toBeUndefined();
      // Nothing pending: the timeout timer was cleared on success.
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
