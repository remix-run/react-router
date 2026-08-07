import {
  getPathsWithAncestors,
  getPatchRoutesOnNavigationFunction,
} from "../../../lib/dom/ssr/fog-of-war";
import type { AssetsManifest } from "../../../lib/dom/ssr/entry";
import type { EntryRoute } from "../../../lib/dom/ssr/routes";

function entryRoute(id: string, init: Partial<EntryRoute> = {}): EntryRoute {
  return {
    id,
    parentId: "root",
    module: `/build/${id}.js`,
    hasAction: false,
    hasLoader: false,
    hasClientAction: false,
    hasClientLoader: false,
    hasClientMiddleware: false,
    hasErrorBoundary: false,
    clientActionModule: undefined,
    clientLoaderModule: undefined,
    clientMiddlewareModule: undefined,
    hydrateFallbackModule: undefined,
    ...init,
  };
}

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

  describe("lazy route discovery", () => {
    let manifest: AssetsManifest;
    let patched: string[];
    let originalFetch = global.fetch;

    // A `patch` implementation that mirrors the router's own callback, which
    // no-ops once the triggering navigation/fetcher signal has aborted
    // (see `patch` in `discoverRoutes` in router.ts)
    function makePatch(signal: AbortSignal) {
      return (routeId: string | null, children: unknown[]) => {
        if (signal.aborted) return;
        children.forEach((child) => patched.push((child as { id: string }).id));
      };
    }

    // Resolve the manifest request, optionally aborting while the response body
    // is being read so the request completes but the triggering
    // navigation/fetcher is already gone when the patches would be applied
    function mockManifestFetch(
      patches: Record<string, EntryRoute>,
      onJson?: () => void,
    ) {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => {
          onJson?.();
          return patches;
        },
      }) as unknown as typeof global.fetch;
    }

    function discover(path: string, signal: AbortSignal) {
      let router = {
        state: {
          location: { pathname: "/", search: "", hash: "" },
          navigation: { location: undefined },
        },
        basename: undefined,
      };
      let patchRoutesOnNavigation = getPatchRoutesOnNavigationFunction(
        () => router as any,
        manifest,
        {},
        true,
        { mode: "lazy", manifestPath: "/__manifest" },
        false,
        undefined,
      )!;
      return patchRoutesOnNavigation({
        path,
        matches: [],
        patch: makePatch(signal),
        signal,
      } as any);
    }

    beforeEach(() => {
      manifest = {
        entry: { imports: [], module: "/build/entry.js" },
        routes: { root: entryRoute("root", { parentId: undefined, path: "" }) },
        url: "/build/manifest.js",
        version: "abc123",
      };
      patched = [];
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    test("re-discovers a path when a prior discovery was aborted mid-flight", async () => {
      let controller = new AbortController();
      mockManifestFetch(
        { "routes/a": entryRoute("routes/a", { path: "a" }) },
        () => controller.abort(),
      );

      await discover("/a", controller.signal);

      expect(patched).toEqual([]);

      // The aborted attempt must not leave the path cached as discovered, or
      // the route tree stays unpatched for the rest of the session
      mockManifestFetch({ "routes/a": entryRoute("routes/a", { path: "a" }) });
      await discover("/a", new AbortController().signal);

      expect(global.fetch).toHaveBeenCalled();
      expect(patched).toEqual(["routes/a"]);
      expect(Object.keys(manifest.routes)).toEqual(["root", "routes/a"]);
    });

    test("only discovers a path once when it is not aborted", async () => {
      mockManifestFetch({ "routes/b": entryRoute("routes/b", { path: "b" }) });

      await discover("/b", new AbortController().signal);

      expect(patched).toEqual(["routes/b"]);
      expect(Object.keys(manifest.routes)).toEqual(["root", "routes/b"]);

      mockManifestFetch({});
      await discover("/b", new AbortController().signal);

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
