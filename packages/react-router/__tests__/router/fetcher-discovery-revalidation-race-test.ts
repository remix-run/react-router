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
import { getSingleFetchDataStrategyImpl } from "../../lib/dom/ssr/single-fetch";
import {
  type Router,
  createRouter,
  createStaticHandler,
} from "../../lib/router/router";
import { type DataRouteObject } from "../../lib/router/utils";
import { getFetcherData } from "./utils/data-router-setup";
import { createDeferred, createFormData, tick } from "./utils/utils";

let router: Router;

for (let customDiscovery of [false, true]) {
  describe(`fetcher discovery race (custom discovery: ${customDiscovery})`, () => {
    testDiscoveryRace(customDiscovery);
  });
}

function testDiscoveryRace(unstable_customRouteDiscovery: boolean) {
  afterEach(() => {
    router.dispose();
    // @ts-expect-error
    router = null;
  });

  it("does not revalidate a mid-initial-load fetcher against the splat route during discovery", async () => {
    const manifestDfd = createDeferred<DataRouteObject[]>();
    const apiLoaderDfd = createDeferred();
    const splatLoaderCalls: string[] = [];
    const apiLoaderCalls: string[] = [];

    router = createRouter({
      future: { unstable_customRouteDiscovery },
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

    // 3. Revalidation leaves discovery running, so the original load fires
    //    the correct request once discovery completes.
    manifestDfd.resolve([
      {
        id: "api",
        path: "/api/foo",
        loader({ request }) {
          apiLoaderCalls.push(request.url);

          return apiLoaderDfd.promise;
        },
      },
    ] satisfies DataRouteObject[]);
    await tick();
    apiLoaderDfd.resolve("API");
    await tick();

    expect(apiLoaderCalls.length).toBe(1);
    expect(apiLoaderCalls[0]).toContain("/api/foo");
    expect(fetcherData.get(key)).toBe("API");
  });

  it.each([false, true])(
    "does not complete a navigation awaiting discovery with a fetcher action revalidation (subscriber navigation: %s)",
    async (subscriberNavigation) => {
      const manifestDfd = createDeferred();
      const revalidationDfd = createDeferred();
      let detailLoads = 0;
      let editLoaderRan = false;

      router = createRouter({
        future: { unstable_customRouteDiscovery },
        history: createMemoryHistory({ initialEntries: ["/detail"] }),
        routes: [
          {
            id: "root",
            path: "/",
            children: [
              {
                id: "detail",
                path: "detail",
                loader: () =>
                  ++detailLoads === 2 ? revalidationDfd.promise : null,
              },
              { id: "api", path: "api", action: () => null },
            ],
          },
        ],
        async patchRoutesOnNavigation({ path, patch }) {
          if (path === "/detail/edit") {
            await manifestDfd.promise;
            patch("root", [
              {
                id: "edit",
                path: "detail/edit",
                loader: () => {
                  editLoaderRan = true;
                  return null;
                },
              },
            ]);
          }
        },
      }).initialize();
      await tick();

      if (subscriberNavigation) {
        router.subscribe((state) => {
          if (state.navigation.location?.pathname === "/interrupted") {
            router.navigate("/detail/edit");
          }
        });
      }

      // A fetcher action completes and its revalidation of /detail stays pending
      const key = "my-fetcher";
      router.fetch(key, "root", "/api", {
        formMethod: "post",
        formData: createFormData({}),
      });
      await tick();
      expect(router.state.fetchers.get(key)?.state).toBe("loading");

      // Navigate to a route that is not discovered yet
      router.navigate(subscriberNavigation ? "/interrupted" : "/detail/edit");
      await tick();
      expect(router.state.navigation.state).toBe("loading");

      // The revalidation settles while the navigation awaits discovery. It must
      // not commit the navigation with the current page's matches.
      revalidationDfd.resolve(null);
      await tick();
      expect(router.state.navigation.state).toBe("loading");
      expect(router.state.location.pathname).toBe("/detail");

      manifestDfd.resolve(null);
      await tick();
      await tick();

      expect(router.state.navigation.state).toBe("idle");
      expect(router.state.location.pathname).toBe("/detail/edit");
      expect(router.state.matches.map((m) => m.route.id)).toEqual([
        "root",
        "edit",
      ]);
      expect(editLoaderRan).toBe(true);
      expect(router.getFetcher(key).state).toBe("idle");
    },
  );

  it.each([false, true])(
    "revalidates the current URL and matches when an action finishes during discovery (splat: %s)",
    async (withSplat) => {
      let discoveryDfd = createDeferred();
      let actionDfd = createDeferred();
      let detailLoader = jest.fn(
        ({ request }: { request: Request }) => request.url,
      );
      let editLoader = jest.fn(() => "EDIT");
      let serverRoutes = [
        {
          id: "root",
          path: "/",
          loader: () => "ROOT",
          children: [
            { id: "detail", path: "detail", loader: detailLoader },
            { id: "edit", path: "detail/edit", loader: editLoader },
            { id: "api", path: "api", action: () => actionDfd.promise },
          ],
        },
      ];
      let { query } = createStaticHandler(serverRoutes);
      let singleFetchRequests: Array<{ url: string; routeIds?: string[] }> = [];
      let serverHandler = (_: unknown, serverLoad?: unknown) => {
        if (typeof serverLoad !== "function") {
          throw new Error("Missing server handler");
        }
        return serverLoad();
      };

      router = createRouter({
        future: { unstable_customRouteDiscovery },
        history: createMemoryHistory({
          initialEntries: ["/detail?current=1#hash"],
        }),
        hydrationData: { loaderData: { root: "ROOT", detail: "INITIAL" } },
        routes: [
          {
            id: "root",
            path: "/",
            loader: serverHandler,
            shouldRevalidate: () => false,
            children: [
              { id: "detail", path: "detail", loader: serverHandler },
              { id: "api", path: "api", action: serverHandler },
              ...(withSplat
                ? [{ id: "splat", path: "*", loader: serverHandler }]
                : []),
            ],
          },
        ],
        async patchRoutesOnNavigation({ path, patch }) {
          if (path === "/detail/edit") {
            await discoveryDfd.promise;
            patch("root", [
              { id: "edit", path: "detail/edit", loader: serverHandler },
            ]);
          }
        },
        dataStrategy: getSingleFetchDataStrategyImpl(
          () => router,
          (match) => ({
            hasLoader: match.route.loader != null,
            hasClientLoader: false,
          }),
          async ({ request }, routeIds) => {
            singleFetchRequests.push({ url: request.url, routeIds });
            // The real server matches the request URL before filtering _routes.
            let result = await query(request, {
              filterMatchesToLoad: (m) =>
                !routeIds || routeIds.includes(m.route.id),
            });
            if (result instanceof Response)
              throw new Error("Unexpected response");
            let data =
              request.method === "GET" ? result.loaderData : result.actionData;
            return {
              status: result.statusCode,
              data: {
                routes: Object.fromEntries(
                  Object.entries(data || {}).map(([id, data]) => [
                    id,
                    { data },
                  ]),
                ),
              },
            };
          },
          true,
        ),
      }).initialize();

      let fetcherData = getFetcherData(router);
      router.fetch("mutation", "root", "/api", {
        formMethod: "post",
        formData: createFormData({}),
      });
      await tick();
      let navigation = router.navigate("/detail/edit?target=1");
      await tick();
      await actionDfd.resolve("ACTION");
      await tick();

      expect(singleFetchRequests).toEqual([
        { url: "http://localhost/api", routeIds: ["api"] },
        { url: "http://localhost/detail?current=1", routeIds: ["detail"] },
      ]);
      expect(detailLoader).toHaveBeenCalledTimes(1);
      expect(detailLoader.mock.calls[0][0].request.url).toBe(
        "http://localhost/detail?current=1",
      );
      expect(router.state.loaderData).toEqual({
        root: "ROOT",
        detail: "http://localhost/detail?current=1",
      });
      expect(router.state.errors).toBeNull();
      expect(router.state.navigation.state).toBe("loading");
      expect(router.state.location.pathname).toBe("/detail");
      expect(router.getFetcher("mutation").state).toBe("idle");
      expect(fetcherData.get("mutation")).toBe("ACTION");

      await discoveryDfd.resolve();
      await navigation;
      expect(router.state.location.pathname).toBe("/detail/edit");
      expect(router.state.matches.map((m) => m.route.id)).toEqual([
        "root",
        "edit",
      ]);
      expect(router.state.loaderData).toEqual({ root: "ROOT", edit: "EDIT" });
      expect(router.state.errors).toBeNull();
      expect(editLoader).toHaveBeenCalledTimes(1);
    },
  );

  it("allows a fetcher reload to complete a known navigation after aborting unresolved discovery", async () => {
    let discoveryDfd = createDeferred();
    let actionDfd = createDeferred();
    let navigationLoaderDfd = createDeferred();
    let discoverySignal: AbortSignal | undefined;
    let loaderSignals: AbortSignal[] = [];
    router = createRouter({
      future: { unstable_customRouteDiscovery },
      history: createMemoryHistory({ initialEntries: ["/detail"] }),
      hydrationData: { loaderData: { detail: "DETAIL" } },
      routes: [
        {
          id: "root",
          path: "/",
          children: [
            { id: "detail", path: "detail", loader: () => "DETAIL" },
            { id: "api", path: "api", action: () => actionDfd.promise },
            {
              id: "known",
              path: "known",
              loader({ request }) {
                loaderSignals.push(request.signal);
                return loaderSignals.length === 1
                  ? navigationLoaderDfd.promise
                  : "UPDATED";
              },
            },
          ],
        },
      ],
      async patchRoutesOnNavigation({ path, signal }) {
        if (path === "/undiscovered") {
          discoverySignal = signal;
          await discoveryDfd.promise;
        }
      },
    }).initialize();

    let fetcherData = getFetcherData(router);
    router.fetch("mutation", "root", "/api", {
      formMethod: "post",
      formData: createFormData({}),
    });
    await tick();
    let abandonedNavigation = router.navigate("/undiscovered");
    await tick();
    router.navigate("/known");
    await tick();
    expect(discoverySignal?.aborted).toBe(true);
    expect(loaderSignals).toHaveLength(1);

    await actionDfd.resolve("ACTION");
    await tick();
    expect(loaderSignals).toHaveLength(2);
    expect(loaderSignals[0].aborted).toBe(true);
    expect(loaderSignals[1].aborted).toBe(false);
    expect(router.state.navigation.state).toBe("idle");
    expect(router.state.location.pathname).toBe("/known");
    expect(router.state.loaderData).toEqual({ known: "UPDATED" });
    expect(router.getFetcher("mutation").state).toBe("idle");
    expect(fetcherData.get("mutation")).toBe("ACTION");

    await discoveryDfd.resolve();
    await abandonedNavigation;
    await navigationLoaderDfd.resolve("STALE");
    await tick();
    expect(router.state.loaderData).toEqual({ known: "UPDATED" });
    expect(router.state.errors).toBeNull();
  });

  it("does not revalidate a fetcher during discovery without a splat route", async () => {
    const manifestDfd = createDeferred<DataRouteObject[]>();
    const apiLoaderDfd = createDeferred();
    const apiLoaderCalls: string[] = [];

    router = createRouter({
      future: { unstable_customRouteDiscovery },
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
    ] satisfies DataRouteObject[]);
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
          future: { unstable_customRouteDiscovery },
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
        future: { unstable_customRouteDiscovery },
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

  it.each(["revalidate", "navigation submission", "fetcher submission"])(
    "retains data when a reused fetcher is discovering routes during %s",
    async (interruption) => {
      let discoveryDfd = createDeferred();
      let loaderDfd = createDeferred();
      let revalidationDfd = createDeferred();
      let initialLoader = jest.fn(() => "INITIAL");
      let apiLoader = jest
        .fn()
        .mockImplementationOnce(() => loaderDfd.promise)
        .mockImplementationOnce(() => revalidationDfd.promise);
      let splatLoader = jest.fn(() => "SPLAT");

      router = createRouter({
        future: { unstable_customRouteDiscovery },
        history: createMemoryHistory(),
        routes: [
          { id: "root", path: "/", action: () => null },
          { id: "known", path: "/known", loader: initialLoader },
          { id: "splat", path: "*", loader: splatLoader },
        ],
        async patchRoutesOnNavigation({ path, patch }) {
          if (path === "/api/foo") {
            await discoveryDfd.promise;
            patch(null, [{ id: "api", path: "/api/:id", loader: apiLoader }]);
          }
        },
      }).initialize();

      let fetcherData = getFetcherData(router);
      let key = "fetcher";
      await router.fetch(key, "root", "/known");
      expect(router.getFetcher(key).state).toBe("idle");
      expect(fetcherData.get(key)).toBe("INITIAL");

      // Reuse a settled fetcher while its next target is still undiscovered.
      let nextFetch = router.fetch(key, "root", "/api/foo");
      await tick();
      expect(router.getFetcher(key).state).toBe("loading");
      expect(fetcherData.get(key)).toBe("INITIAL");

      if (interruption === "revalidate") {
        await router.revalidate();
      } else if (interruption === "navigation submission") {
        await router.navigate("/", {
          formMethod: "post",
          formData: new FormData(),
        });
      } else {
        await router.fetch("action-fetcher", "root", "/", {
          formMethod: "post",
          formData: new FormData(),
        });
      }

      expect(splatLoader).not.toHaveBeenCalled();
      expect(apiLoader).not.toHaveBeenCalled();
      expect(router.getFetcher(key).state).toBe("loading");
      expect(fetcherData.get(key)).toBe("INITIAL");
      expect(router.state.errors).toBeNull();

      // Keep the previous data until the newly discovered loader completes.
      await discoveryDfd.resolve();
      await tick();
      expect(apiLoader).toHaveBeenCalledTimes(1);
      expect(router.getFetcher(key).state).toBe("loading");
      expect(fetcherData.get(key)).toBe("INITIAL");

      await loaderDfd.resolve("NEW");
      await nextFetch;
      expect(router.getFetcher(key).state).toBe("idle");
      expect(fetcherData.get(key)).toBe("NEW");

      // Discovery must not prevent later revalidation of this dynamic route.
      let revalidation = router.revalidate();
      await tick();
      expect(apiLoader).toHaveBeenCalledTimes(2);
      expect(router.state.revalidation).toBe("loading");
      expect(router.getFetcher(key).state).toBe("idle");
      expect(fetcherData.get(key)).toBe("NEW");

      await revalidationDfd.resolve("REVALIDATED");
      await revalidation;
      expect(router.getFetcher(key).state).toBe("idle");
      expect(fetcherData.get(key)).toBe("REVALIDATED");
      expect(initialLoader).toHaveBeenCalledTimes(1);
      expect(splatLoader).not.toHaveBeenCalled();
      expect(router.state.errors).toBeNull();
      expect(router.state.navigation.state).toBe("idle");
      expect(router.state.revalidation).toBe("idle");
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
      future: { unstable_customRouteDiscovery },
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

    // Opting in makes discovery abortable when reusing a fetcher key. Neither
    // mode should let the older load clear the new load's discovery state.
    await firstDiscoveryDfd.resolve();
    await tick();
    expect(firstLoader).toHaveBeenCalledTimes(
      unstable_customRouteDiscovery ? 0 : 1,
    );
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
}
