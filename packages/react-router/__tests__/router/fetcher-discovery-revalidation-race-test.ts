/**
 * Repro for: fetcher revalidation during lazy route discovery matches the
 * splat route instead of waiting for discovery to complete.
 *
 * In framework mode this manifests as a single-fetch request with
 * `_routes=routes/$` — the server's match-set intersection is empty, it
 * returns `{ routes: {} }`, and the client throws
 * `SingleFetchNoResultError: No result found for routeId "routes/$"`.
 *
 * Revalidation must wait for the current load's discovery to complete, even
 * when a catch-all matches or an older load with the same key was cancelled.
 * Once discovery completes, interrupted loaders must still be restarted.
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
    //    mid-initial-load, so re-matching its path against the *current*
    //    (still unpatched) route tree would return a splat match. The
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

  it("does not revalidate a fetcher during discovery without a splat route", async () => {
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

    // Same interruption, but there is no catch-all. Discovery must still
    // finish before revalidation can match the fetcher's path.
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

  describe.each(["/api/:id", "/api/*"])("known %s route", (path) => {
    it.each(["revalidate", "navigation submission", "fetcher submission"])(
      "restarts an interrupted initial fetcher load after %s",
      async (interruption) => {
        let initialLoaderDfd = createDeferred();
        let replacementLoaderDfd = createDeferred();
        let loaderSignals: AbortSignal[] = [];
        let splatLoader = jest.fn(() => "SPLAT");

        router = createRouter({
          history: createMemoryHistory(),
          routes: [
            {
              id: "root",
              path: "/",
              action: () => null,
            },
            {
              id: "api",
              path,
              loader({ request }) {
                loaderSignals.push(request.signal);
                return loaderSignals.length === 1
                  ? initialLoaderDfd.promise
                  : replacementLoaderDfd.promise;
              },
            },
            {
              id: "splat",
              path: "*",
              loader: splatLoader,
            },
          ],
          // Discovery completes immediately; the loader itself is still pending.
          patchRoutesOnNavigation() {},
        }).initialize();

        let fetcherData = getFetcherData(router);
        let key = "my-fetcher";
        router.fetch(key, "root", "/api/foo");
        await tick();
        expect(loaderSignals).toHaveLength(1);
        expect(router.state.fetchers.get(key)).toMatchObject({
          state: "loading",
          data: undefined,
        });

        if (interruption === "revalidate") {
          router.revalidate();
        } else if (interruption === "navigation submission") {
          router.navigate("/", {
            formMethod: "post",
            formData: new FormData(),
          });
        } else {
          router.fetch("action-fetcher", "root", "/", {
            formMethod: "post",
            formData: new FormData(),
          });
        }
        await tick();

        expect(loaderSignals[0].aborted).toBe(true);
        expect(loaderSignals).toHaveLength(2);
        expect(loaderSignals[1].aborted).toBe(false);

        // The cancelled result must not settle the fetcher or overwrite new data.
        await initialLoaderDfd.resolve("STALE");
        await tick();
        expect(router.state.fetchers.get(key)).toMatchObject({
          state: "loading",
          data: undefined,
        });

        await replacementLoaderDfd.resolve("FRESH");
        await tick();
        expect(router.getFetcher(key).state).toBe("idle");
        expect(fetcherData.get(key)).toBe("FRESH");
        expect(router.state.errors).toBeNull();
        expect(router.state.navigation.state).toBe("idle");
        expect(router.state.revalidation).toBe("idle");
        expect(splatLoader).not.toHaveBeenCalled();
      },
    );
  });

  it.each([false, true])(
    "waits for new discovery after cancelling an old load (reuse key: %s)",
    async (reuseKey) => {
      let initialLoaderDfd = createDeferred();
      let actionDfd = createDeferred();
      let discoveryDfd = createDeferred();
      let splatLoader = jest.fn(() => "SPLAT");
      let discoveryStarted = false;
      let initialSignal: AbortSignal | undefined;

      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { id: "root", path: "/", action: () => actionDfd.promise },
          {
            id: "known",
            path: "/known/:id",
            loader({ request }) {
              initialSignal ??= request.signal;
              return initialLoaderDfd.promise;
            },
          },
          { id: "splat", path: "*", loader: splatLoader },
        ],
        async patchRoutesOnNavigation({ path, patch }) {
          if (path === "/undiscovered") {
            discoveryStarted = true;
            await discoveryDfd.promise;
            patch(null, [{ id: "new", path, loader: () => "NEW" }]);
          }
        },
      }).initialize();

      let fetcherData = getFetcherData(router);
      let initialFetch = router.fetch("fetcher", "root", "/known/123");
      await tick();
      expect(initialSignal?.aborted).toBe(false);
      expect(router.state.fetchers.get("fetcher")).toMatchObject({
        state: "loading",
        data: undefined,
      });

      // Cancel the known loader, but keep the action pending so its revalidation
      // can race with discovery for a subsequent fetcher load.
      let navigation = router.navigate("/", {
        formMethod: "post",
        formData: new FormData(),
      });
      await tick();
      expect(initialSignal?.aborted).toBe(true);
      expect(router.state.fetchers.get("fetcher")).toMatchObject({
        state: "loading",
        data: undefined,
      });

      let nextKey = reuseKey ? "fetcher" : "another-fetcher";
      let nextFetch = router.fetch(nextKey, "root", "/undiscovered");
      await tick();
      expect(discoveryStarted).toBe(true);
      expect(splatLoader).not.toHaveBeenCalled();

      await actionDfd.resolve("ACTION");
      await tick();
      expect(router.state.fetchers.get(nextKey)).toMatchObject({
        state: "loading",
        data: undefined,
      });
      let splatCallsDuringDiscovery = splatLoader.mock.calls.length;

      // Settle all requests before asserting the result of the race.
      await initialLoaderDfd.resolve("OLD");
      await discoveryDfd.resolve();
      await Promise.all([initialFetch, nextFetch, navigation]);

      expect(splatCallsDuringDiscovery).toBe(0);
      expect(fetcherData.get(nextKey)).toBe("NEW");
      expect(router.getFetcher(nextKey).state).toBe("idle");
      expect(router.state.errors).toBeNull();
    },
  );

  it("does not let an older discovery clear a newer load's discovery state", async () => {
    let firstDiscoveryDfd = createDeferred();
    let secondDiscoveryDfd = createDeferred();
    let firstLoaderDfd = createDeferred();
    let firstLoader = jest.fn(() => firstLoaderDfd.promise);
    let secondLoader = jest.fn(() => "SECOND");
    let splatLoader = jest.fn(() => "SPLAT");
    let discoveringPaths: string[] = [];

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { id: "root", path: "/" },
        { id: "splat", path: "*", loader: splatLoader },
      ],
      async patchRoutesOnNavigation({ path, patch }) {
        discoveringPaths.push(path);
        if (path === "/first") {
          await firstDiscoveryDfd.promise;
          patch(null, [{ id: "first", path, loader: firstLoader }]);
        } else if (path === "/second") {
          await secondDiscoveryDfd.promise;
          patch(null, [{ id: "second", path, loader: secondLoader }]);
        }
      },
    }).initialize();

    let fetcherData = getFetcherData(router);
    let key = "fetcher";
    let firstFetch = router.fetch(key, "root", "/first");
    await tick();
    let secondFetch = router.fetch(key, "root", "/second");
    await tick();
    expect(discoveringPaths).toEqual(["/first", "/second"]);

    // Both discoveries are pending for the same key. Completing the older one
    // must only update its own load record, not the record for /second.
    await firstDiscoveryDfd.resolve();
    await tick();
    expect(firstLoader).toHaveBeenCalledTimes(1);
    expect(secondLoader).not.toHaveBeenCalled();

    let revalidation = router.revalidate();
    await tick();
    let splatCallsDuringDiscovery = splatLoader.mock.calls.length;

    await firstLoaderDfd.resolve("FIRST");
    await secondDiscoveryDfd.resolve();
    await Promise.all([firstFetch, secondFetch, revalidation]);

    expect(splatCallsDuringDiscovery).toBe(0);
    expect(splatLoader).not.toHaveBeenCalled();
    expect(secondLoader).toHaveBeenCalledTimes(1);
    expect(fetcherData.get(key)).toBe("SECOND");
    expect(router.getFetcher(key).state).toBe("idle");
    expect(router.state.errors).toBeNull();
  });
});
