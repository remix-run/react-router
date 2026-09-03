/**
 * Repro for: fetcher revalidation during lazy route discovery matches the
 * splat route instead of waiting for discovery to complete.
 *
 * In framework mode this manifests as a single-fetch request with
 * `_routes=routes/$` — the server's match-set intersection is empty, it
 * returns `{ routes: {} }`, and the client throws
 * `SingleFetchNoResultError: No result found for routeId "routes/$"`.
 *
 * The guard added in PR #13564 (`isMidInitialLoad` skip in getMatchesToLoad)
 * only fires when `matchRoutes` returns null. An app with a root-level
 * catch-all route (`path: "*"`, e.g. framework mode `routes/$.tsx`) never
 * gets null matches — the splat always matches — so the guard is bypassed and
 * a revalidation round that interrupts the in-flight initial load re-targets
 * the fetcher at the splat route instead of waiting for discovery to patch
 * the real route into the tree.
 */
import { createMemoryHistory } from "../../lib/router/history";
import { type Router, createRouter } from "../../lib/router/router";
import { type AgnosticDataRouteObject } from "../../lib/router/utils";
import { getFetcherData } from "./utils/data-router-setup";
import { createDeferred, tick } from "./utils/utils";

let router: Router;

describe("fetcher revalidation vs. lazy route discovery race", () => {
  afterEach(() => {
    router.dispose();
    // @ts-expect-error
    router = null;
  });

  it("does not revalidate a mid-initial-load fetcher against the splat route during discovery", async () => {
    const manifestDfd = createDeferred<AgnosticDataRouteObject[]>();
    const apiLoaderDfd = createDeferred();
    const splatLoaderCalls: string[] = [];
    const apiLoaderCalls: string[] = [];

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          id: "root",
          path: "/",
        },
        {
          id: "splat",
          path: "*",
          loader({ request }) {
            splatLoaderCalls.push(request.url);

            return "SPLAT";
          },
        },
      ],
      async patchRoutesOnNavigation({ path, patch }) {
        if (path === "/api/foo") {
          const children = await manifestDfd.promise;
          patch(null, children);
        }
      },
    });
    router.initialize();
    await tick();

    const fetcherData = getFetcherData(router);
    const key = "my-fetcher";

    // 1. Fetcher load to an undiscovered resource route. It matches the
    //    splat route, so fog-of-war discovery kicks in and awaits the
    //    (deliberately slow) manifest response.
    router.fetch(key, "root", "/api/foo");
    await tick();
    expect(router.state.fetchers.get(key)?.state).toBe("loading");
    // Discovery is in flight; no loader has run yet
    expect(splatLoaderCalls.length).toBe(0);

    // 2. Anything that interrupts active loads triggers a revalidation round
    //    (fetcher.submit, form submission, useRevalidator). The fetcher is
    //    mid-initial-load, so getMatchesToLoad re-matches its path against
    //    the *current* (still unpatched) route tree -> splat match. The
    //    splat's loader must NOT run for a route that is still being
    //    discovered — doing so fires a single-fetch request against the
    //    splat route id and throws SingleFetchNoResultError in framework mode.
    router.revalidate();
    await tick();

    expect(splatLoaderCalls.length).toBe(0);

    // 3. The original in-flight load survives (it was never abortable —
    //    fetchControllers isn't registered until after discovery) and fires
    //    the *correct* request once discovery completes.
    manifestDfd.resolve([
      {
        id: "api",
        path: "/api/foo",
        loader({ request }) {
          apiLoaderCalls.push(request.url);

          return apiLoaderDfd.promise;
        },
      },
    ]);
    await tick();
    apiLoaderDfd.resolve("API");
    await tick();

    expect(apiLoaderCalls.length).toBe(1);
    expect(apiLoaderCalls[0]).toContain("/api/foo");
    expect(fetcherData.get(key)).toBe("API");
  });

  it("control: without a splat route, the isMidInitialLoad guard works", async () => {
    const manifestDfd = createDeferred<AgnosticDataRouteObject[]>();
    const apiLoaderDfd = createDeferred();
    const apiLoaderCalls: string[] = [];

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          id: "root",
          path: "/",
        },
      ],
      async patchRoutesOnNavigation({ path, patch }) {
        if (path === "/api/foo") {
          const children = await manifestDfd.promise;
          patch(null, children);
        }
      },
    });
    router.initialize();
    await tick();

    const fetcherData = getFetcherData(router);
    const key = "my-fetcher";

    router.fetch(key, "root", "/api/foo");
    await tick();
    expect(router.state.fetchers.get(key)?.state).toBe("loading");

    // Same interruption — but matchRoutes returns null (no catch-all), so
    // the isMidInitialLoad guard skips revalidation as intended.
    router.revalidate();
    await tick();

    manifestDfd.resolve([
      {
        id: "api",
        path: "/api/foo",
        loader({ request }) {
          apiLoaderCalls.push(request.url);

          return apiLoaderDfd.promise;
        },
      },
    ]);
    await tick();
    apiLoaderDfd.resolve("API");
    await tick();

    expect(apiLoaderCalls.length).toBe(1);
    expect(apiLoaderCalls[0]).toContain("/api/foo");
    expect(fetcherData.get(key)).toBe("API");
  });
});
