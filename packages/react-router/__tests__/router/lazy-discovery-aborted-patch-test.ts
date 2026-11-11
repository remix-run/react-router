/**
 * Regression tests for https://github.com/remix-run/react-router/issues/15327
 *
 * `fetchAndApplyManifestPatches` used to mutate `manifest.routes` and add the
 * path to the module-singleton `discoveredPaths` FIFO unconditionally once the
 * `/__manifest` response body settled, while the router's `patch` callback
 * no-ops when the triggering navigation/fetcher signal has aborted in the
 * meantime.  An abort landing in that window cached the path as "discovered"
 * for the rest of the session while the route tree was never patched, so
 * every subsequent visit matched an ambiguous route (e.g., a catch-all)
 * instead of the real one - or 404ed when nothing matched.
 *
 * These tests use the real `getPatchRoutesOnNavigationFunction` wired to the
 * real router; only `global.fetch` is mocked, exactly like the network layer
 * is the only thing mocked in lazy-discovery-test.ts.
 */
import { type AssetsManifest } from "../../lib/dom/ssr/entry";
import { getPatchRoutesOnNavigationFunction } from "../../lib/dom/ssr/fog-of-war";
import { createMemoryHistory } from "../../lib/router/history";
import { type Router, createRouter } from "../../lib/router/router";
import { getFetcherData } from "./utils/data-router-setup";
import { createDeferred, tick } from "./utils/utils";

let router: Router;

function makeEntryRoute(
  id: string,
  parentId: string | undefined,
  path: string | undefined,
  opts: Partial<{ index: boolean; hasLoader: boolean }> = {},
) {
  return {
    id,
    parentId,
    path,
    index: opts.index,
    module: `/build/${id.replace(/[^a-zA-Z0-9]/g, "_")}.js`,
    hasAction: false,
    hasLoader: opts.hasLoader ?? false,
    hasClientAction: false,
    hasClientLoader: false,
    hasClientMiddleware: false,
    hasErrorBoundary: false,
  };
}

function makeManifest(): AssetsManifest {
  return {
    entry: { imports: [], module: "/build/entry.client.js" },
    url: "/build/manifest.js",
    version: "single-build-abc123",
    routes: {
      root: makeEntryRoute("root", undefined, ""),
      "routes/_index": makeEntryRoute("routes/_index", "root", undefined, {
        index: true,
      }),
      "routes/$": makeEntryRoute("routes/$", "root", "*", { hasLoader: true }),
    },
  };
}

/**
 * Minimal manifest-response mock.  `json()` resolution is controlled by the
 * test so we can interleave the abort exactly where it lands in production:
 * the response body has fully settled, but the awaiting continuation in
 * `fetchAndApplyManifestPatches` has not run yet when a user-triggered event
 * (click -> navigate) aborts the signal synchronously.  Once `json()` has
 * settled, a real fetch abort is a no-op too, so this mock is
 * behavior-accurate for that window.
 */
function mockManifestFetch(jsonDfd: { promise: Promise<unknown> }) {
  let fetchMock = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => jsonDfd.promise,
      text: () => Promise.resolve(""),
    }),
  );
  // @ts-expect-error - jsdom global
  global.fetch = fetchMock;

  return fetchMock;
}

function createAppRouter(
  manifest: AssetsManifest,
  catchallLoader: (args: { request: Request }) => unknown,
  { includeCatchall = true } = {},
) {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        id: "root",
        path: "",
        children: [
          { id: "routes/_index", index: true },
          ...(includeCatchall
            ? [{ id: "routes/$", path: "*", loader: catchallLoader }]
            : []),
        ],
      },
    ],
    // The real production fog-of-war implementation
    patchRoutesOnNavigation: getPatchRoutesOnNavigationFunction(
      () => router,
      manifest,
      /* routeModules */ {},
      /* ssr */ true,
      /* routeDiscovery */ { mode: "lazy", manifestPath: "/__manifest" },
      /* isSpaMode */ false,
      /* basename */ undefined,
    ),
  });
}

describe("aborted lazy route discovery does not poison the discovery cache", () => {
  afterEach(() => {
    router.dispose();
    // @ts-expect-error
    router = null;
  });

  it("[control] non-aborted discovery patches the real route into the tree", async () => {
    let manifest = makeManifest();
    let jsonDfd = createDeferred();
    let fetchMock = mockManifestFetch(jsonDfd);
    router = createAppRouter(manifest, () => "SPLAT");

    router.navigate("/real-ctrl");
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Manifest response arrives, nothing aborts it
    jsonDfd.resolve({
      "routes/real-ctrl": makeEntryRoute(
        "routes/real-ctrl",
        "root",
        "real-ctrl",
      ),
    });
    await tick();
    await tick();

    // Route tree WAS patched -> real route now exists as a sibling of routes/$
    let rootChildren = router.routes[0].children!.map((r) => r.id);
    expect(rootChildren).toContain("routes/real-ctrl");
  });

  it("re-discovers a path whose discovery was aborted after the manifest response settled", async () => {
    let manifest = makeManifest();
    let jsonDfd = createDeferred();
    let fetchMock = mockManifestFetch(jsonDfd);
    let catchallLoader = jest.fn(
      ({ request }: { request: Request }) => `SPLAT:${request.url}`,
    );
    router = createAppRouter(manifest, catchallLoader);

    // 1) Navigate to a route the client tree doesn't know yet -> discovery
    router.navigate("/real");
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // 2) The /__manifest response body settles...
    jsonDfd.resolve({
      "routes/real": makeEntryRoute("routes/real", "root", "real"),
    });
    // 3) ...and in the same task (before the awaiting continuation in
    //    fetchAndApplyManifestPatches runs) the user clicks something else.
    //    startNavigation aborts pendingNavigationController synchronously.
    router.navigate("/");
    await tick();
    expect(router.state.location.pathname).toBe("/");

    // Nothing was cached or mutated for the aborted discovery
    expect(manifest.routes["routes/real"]).toBeUndefined();
    expect(router.routes[0].children!.map((r) => r.id)).not.toContain(
      "routes/real",
    );

    // 4) Same session, same build: navigate to /real again -> discovery
    //    re-runs (the path was NOT marked as discovered) and the tree is
    //    patched with the real route, which wins over the catch-all
    router.navigate("/real");
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await tick();
    await tick();

    expect(manifest.routes["routes/real"]).toBeDefined();
    expect(router.routes[0].children!.map((r) => r.id)).toContain(
      "routes/real",
    );
    // The real route - not the catch-all - is what the navigation targets
    // (the navigation itself can't complete in jsdom because the patched
    // route's module can't be imported, which is unrelated to discovery)
    expect(catchallLoader).not.toHaveBeenCalled();
  });

  it("re-discovers on fetcher.load after a navigation discovery for the path was aborted", async () => {
    let manifest = makeManifest();
    let jsonDfd = createDeferred();
    let fetchMock = mockManifestFetch(jsonDfd);
    let catchallLoader = jest.fn(
      ({ request }: { request: Request }) => `SPLAT:${request.url}`,
    );
    router = createAppRouter(manifest, catchallLoader);
    getFetcherData(router);

    // Aborted navigation discovery for the path (discoveredPaths is a
    // module-level singleton shared across navigations and fetchers)
    router.navigate("/api/widget");
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    jsonDfd.resolve({
      "routes/api.widget": makeEntryRoute(
        "routes/api.widget",
        "root",
        "api/widget",
      ),
    });
    router.navigate("/");
    await tick();

    // Not poisoned
    expect(manifest.routes["routes/api.widget"]).toBeUndefined();

    // A widget mounts and calls fetcher.load -> discovery re-runs and the
    // real route (not the catch-all) becomes the fetcher's match
    router.fetch("widget-fetcher", "root", "/api/widget?x=1");
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await tick();
    await tick();

    expect(router.routes[0].children!.map((r) => r.id)).toContain(
      "routes/api.widget",
    );
    expect(catchallLoader).not.toHaveBeenCalled();
  });

  it("does not 404 a fetcher for a path whose discovery was aborted (no catch-all)", async () => {
    let manifest = makeManifest();
    delete manifest.routes["routes/$"];
    let jsonDfd = createDeferred();
    let fetchMock = mockManifestFetch(jsonDfd);
    router = createAppRouter(manifest, () => null, { includeCatchall: false });
    getFetcherData(router);

    // Aborted navigation discovery for the path
    router.navigate("/api/tenants");
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    jsonDfd.resolve({
      "routes/api.tenants": makeEntryRoute(
        "routes/api.tenants",
        "root",
        "api/tenants",
      ),
    });
    router.navigate("/");
    await tick();

    router.fetch("tenants-fetcher", "root", "/api/tenants?userId=u1");
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await tick();
    await tick();

    // The path was re-discovered and matched - no 404
    expect(router.routes[0].children!.map((r) => r.id)).toContain(
      "routes/api.tenants",
    );
    expect(router.state.errors).toBeFalsy();
  });
});
