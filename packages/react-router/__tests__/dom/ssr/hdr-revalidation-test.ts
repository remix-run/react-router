import { createClientRoutesWithHMRRevalidationOptOut } from "../../../lib/dom/ssr/routes";
import type { EntryRoute } from "../../../lib/dom/ssr/routes";
import type { RouteModules } from "../../../lib/dom/ssr/routeModules";
import { getSingleFetchDataStrategyImpl } from "../../../lib/dom/ssr/single-fetch";
import { createMemoryHistory } from "../../../lib/router/history";
import { createRouter } from "../../../lib/router/router";
import type { Router as DataRouter } from "../../../lib/router/router";
import type { DataRouteMatch } from "../../../lib/router/utils";

function entryRoute(route: Partial<EntryRoute> & { id: string }): EntryRoute {
  return {
    hasAction: false,
    hasLoader: false,
    hasClientAction: false,
    hasClientLoader: false,
    hasClientMiddleware: false,
    hasErrorBoundary: false,
    module: `/${route.id}.js`,
    clientActionModule: undefined,
    clientLoaderModule: undefined,
    clientMiddlewareModule: undefined,
    hydrateFallbackModule: undefined,
    ...route,
  } as EntryRoute;
}

// Stand up the browser-side pieces `HydratedRouter` wires together - client
// routes built for an HDR update plus the Single Fetch data strategy - with the
// `.data` request stubbed out so we can assert on revalidation decisions.
function setup({
  needsRevalidation,
  shouldRevalidate,
}: {
  needsRevalidation: Set<string>;
  shouldRevalidate: Record<string, () => boolean>;
}) {
  let manifestRoutes: Record<string, EntryRoute> = {
    root: entryRoute({ id: "root", path: "/", hasLoader: true }),
    index: entryRoute({
      id: "index",
      parentId: "root",
      index: true,
      hasLoader: true,
    }),
  };

  let authoredCalls: Record<string, number> = { root: 0, index: 0 };
  let routeModules = Object.fromEntries(
    Object.keys(manifestRoutes).map((id) => [
      id,
      {
        default: () => null,
        shouldRevalidate: () => {
          authoredCalls[id]++;
          return shouldRevalidate[id]();
        },
      },
    ]),
  ) as unknown as RouteModules;

  let serverData: Record<string, string> = {
    root: "root:before",
    index: "index:before",
  };
  let loaderRuns: Record<string, number> = { root: 0, index: 0 };

  let routes = createClientRoutesWithHMRRevalidationOptOut(
    needsRevalidation,
    manifestRoutes,
    routeModules,
    { loaderData: { ...serverData } },
    true, // ssr
    false, // isSpaMode
  );

  let router: DataRouter;
  router = createRouter({
    routes,
    history: createMemoryHistory({ initialEntries: ["/"] }),
    hydrationData: { loaderData: { ...serverData } },
    dataStrategy: (args) =>
      args.runClientMiddleware(
        getSingleFetchDataStrategyImpl(
          () => router,
          (match: DataRouteMatch) => ({
            hasLoader: manifestRoutes[match.route.id].hasLoader,
            hasClientLoader: manifestRoutes[match.route.id].hasClientLoader,
          }),
          async (_args, targetRoutes) => {
            let ids = targetRoutes ?? Object.keys(manifestRoutes);
            return {
              status: 200,
              data: {
                routes: Object.fromEntries(
                  ids.map((id) => {
                    loaderRuns[id]++;
                    return [id, { data: serverData[id] }];
                  }),
                ),
              },
            };
          },
          true, // ssr
        ),
      ),
  });
  router.initialize();

  return {
    router,
    authoredCalls,
    loaderRuns,
    // Stand in for the file edits that triggered the HDR update
    editLoaders() {
      serverData.root = "root:after";
      serverData.index = "index:after";
    },
    // Mirrors how the dev HMR runtime brackets its `router.revalidate()`
    async hdrRevalidate() {
      window.__reactRouterHdrActive = true;
      try {
        await router.revalidate();
      } finally {
        window.__reactRouterHdrActive = false;
      }
    },
  };
}

describe("HDR revalidation", () => {
  afterEach(() => {
    window.__reactRouterHdrActive = false;
  });

  it("revalidates an edited route that opts out via shouldRevalidate", async () => {
    let t = setup({
      needsRevalidation: new Set(["index"]),
      shouldRevalidate: { root: () => true, index: () => false },
    });

    t.editLoaders();
    await t.hdrRevalidate();

    // The edited route revalidates even though it opted out...
    expect(t.router.state.loaderData.index).toBe("index:after");
    expect(t.loaderRuns.index).toBe(1);
    // ...and its own `shouldRevalidate` is never consulted while HDR is in
    // flight, so it can't flip the decision partway through.
    expect(t.authoredCalls.index).toBe(0);
  });

  it("keeps routes outside the HDR set opted out", async () => {
    let t = setup({
      needsRevalidation: new Set(["index"]),
      shouldRevalidate: { root: () => true, index: () => false },
    });

    t.editLoaders();
    await t.hdrRevalidate();

    // `root` wasn't edited, so HDR leaves it alone despite its own
    // `shouldRevalidate` returning `true`
    expect(t.router.state.loaderData.root).toBe("root:before");
    expect(t.loaderRuns.root).toBe(0);
    expect(t.authoredCalls.root).toBe(0);
  });

  it("does not revalidate an unedited route that opts out", async () => {
    let t = setup({
      needsRevalidation: new Set(["root"]),
      shouldRevalidate: { root: () => true, index: () => false },
    });

    t.editLoaders();
    await t.hdrRevalidate();

    expect(t.router.state.loaderData.index).toBe("index:before");
    expect(t.loaderRuns.index).toBe(0);
  });

  it("restores the authored policy once HDR is done", async () => {
    let t = setup({
      needsRevalidation: new Set(["index"]),
      shouldRevalidate: { root: () => true, index: () => false },
    });

    t.editLoaders();
    await t.hdrRevalidate();
    await t.router.revalidate();

    // `index` opted out and `root` opted in, both under their own policy
    expect(t.router.state.loaderData.index).toBe("index:after");
    expect(t.router.state.loaderData.root).toBe("root:after");
    expect(t.authoredCalls.index).toBeGreaterThan(0);
    expect(t.authoredCalls.root).toBeGreaterThan(0);
  });
});
