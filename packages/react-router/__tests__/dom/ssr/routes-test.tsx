import type { AssetsManifest } from "../../../lib/dom/ssr/entry";
import { getHydrationData } from "../../../lib/dom/ssr/hydration";
import { fetchAndApplyManifestPatches } from "../../../lib/dom/ssr/fog-of-war";
import { RouteDiscoveryRuntime } from "../../../lib/dom/ssr/route-discovery";
import type { RouteModules } from "../../../lib/dom/ssr/routeModules";
import type { EntryRoute } from "../../../lib/dom/ssr/routes";
import {
  createClientRoutes,
  createClientRoutesWithHMRRevalidationOptOut,
  createServerRoutes,
} from "../../../lib/dom/ssr/routes";
import { createMemoryHistory } from "../../../lib/router/history";
import { createRouter } from "../../../lib/router/router";
import type { RouteManifest } from "../../../lib/router/utils";
import { matchRoutes } from "../../../lib/router/utils";

function makeEntryRoute(
  overrides: Partial<EntryRoute> & Pick<EntryRoute, "id">,
): EntryRoute {
  return {
    module: `/assets/${overrides.id}.js`,
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
    ...overrides,
  };
}

describe("createClientRoutes", () => {
  test("preserves caseSensitive on critical and lazy routes to match createServerRoutes", () => {
    let manifest: RouteManifest<EntryRoute> = {
      root: makeEntryRoute({ id: "root", path: "/" }),
      "routes/upper": makeEntryRoute({
        id: "routes/upper",
        parentId: "root",
        path: "About",
        caseSensitive: true,
      }),
      "routes/lower": makeEntryRoute({
        id: "routes/lower",
        parentId: "root",
        path: "about",
        caseSensitive: true,
      }),
      "routes/lazy": makeEntryRoute({
        id: "routes/lazy",
        parentId: "root",
        path: "Settings",
        caseSensitive: true,
      }),
    };

    let routeModules: RouteModules = {
      root: { default: () => null },
      "routes/upper": { default: () => null },
      "routes/lower": { default: () => null },
    };

    let serverRoutes = createServerRoutes(
      manifest,
      {
        ...routeModules,
        "routes/lazy": { default: () => null },
      },
      {},
      false,
    );
    let clientRoutes = createClientRoutes(
      manifest,
      routeModules,
      null,
      true,
      false,
    );

    expect(matchRoutes(serverRoutes, "/About")?.map((m) => m.route.id)).toEqual(
      ["root", "routes/upper"],
    );
    expect(matchRoutes(serverRoutes, "/about")?.map((m) => m.route.id)).toEqual(
      ["root", "routes/lower"],
    );
    expect(matchRoutes(clientRoutes, "/About")?.map((m) => m.route.id)).toEqual(
      ["root", "routes/upper"],
    );
    expect(matchRoutes(clientRoutes, "/about")?.map((m) => m.route.id)).toEqual(
      ["root", "routes/lower"],
    );

    expect(
      matchRoutes(clientRoutes, "/Settings")?.map((m) => m.route.id),
    ).toEqual(["root", "routes/lazy"]);
    expect(matchRoutes(clientRoutes, "/settings")).toBeNull();
  });

  test("preserves caseSensitive during getHydrationData matching", () => {
    let manifest: RouteManifest<EntryRoute> = {
      root: makeEntryRoute({ id: "root", path: "/", hasLoader: true }),
      "routes/upper": makeEntryRoute({
        id: "routes/upper",
        parentId: "root",
        path: "About",
        caseSensitive: true,
        hasLoader: true,
      }),
      "routes/lower": makeEntryRoute({
        id: "routes/lower",
        parentId: "root",
        path: "about",
        caseSensitive: true,
        hasLoader: false,
      }),
    };

    let routeModules: RouteModules = {
      root: { default: () => null },
      "routes/upper": { default: () => null },
      "routes/lower": { default: () => null },
    };

    let clientRoutes = createClientRoutes(
      manifest,
      routeModules,
      { loaderData: { root: "root" } },
      true,
      false,
    );

    let hydrationData = getHydrationData({
      state: { loaderData: { root: "root" } },
      routes: clientRoutes,
      getRouteInfo: (routeId) => ({
        clientLoader: routeModules[routeId]?.clientLoader,
        hasLoader: manifest[routeId]?.hasLoader === true,
        hasHydrateFallback: routeModules[routeId]?.HydrateFallback != null,
      }),
      location: { pathname: "/about", search: "", hash: "" },
      basename: "/",
      future: {},
      isSpaMode: false,
    });

    expect(hydrationData.loaderData).toEqual({
      root: "root",
      "routes/lower": null,
    });
  });

  test("preserves caseSensitive in createClientRoutesWithHMRRevalidationOptOut", () => {
    let manifest: RouteManifest<EntryRoute> = {
      root: makeEntryRoute({ id: "root", path: "/" }),
      "routes/upper": makeEntryRoute({
        id: "routes/upper",
        parentId: "root",
        path: "About",
        caseSensitive: true,
      }),
      "routes/lower": makeEntryRoute({
        id: "routes/lower",
        parentId: "root",
        path: "about",
        caseSensitive: true,
      }),
    };

    let routeModules: RouteModules = {
      root: { default: () => null },
      "routes/upper": { default: () => null },
      "routes/lower": { default: () => null },
    };

    let hmrRoutes = createClientRoutesWithHMRRevalidationOptOut(
      new Set(["routes/lower"]),
      manifest,
      routeModules,
      { loaderData: {} },
      true,
      false,
    );

    expect(matchRoutes(hmrRoutes, "/About")?.map((m) => m.route.id)).toEqual([
      "root",
      "routes/upper",
    ]);
    expect(matchRoutes(hmrRoutes, "/about")?.map((m) => m.route.id)).toEqual([
      "root",
      "routes/lower",
    ]);
  });

  test("preserves caseSensitive when patching routes via lazy route discovery", async () => {
    let root = makeEntryRoute({ id: "root", path: "/" });
    let upper = makeEntryRoute({
      id: "routes/upper",
      parentId: "root",
      path: "About",
      caseSensitive: true,
    });
    let manifest: AssetsManifest = {
      url: "/assets/manifest.js",
      version: "v1",
      entry: { module: "/assets/entry.js", imports: [] },
      routes: { root },
    };
    let router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/"] }),
      routes: [{ id: "root", path: "/" }],
    });

    await fetchAndApplyManifestPatches(
      ["/About"],
      null,
      manifest,
      {},
      true,
      false,
      "/",
      "/__manifest",
      router.patchRoutes,
      undefined,
      async () => Response.json({ "routes/upper": upper }),
    );

    expect(router.match("/About")?.map((m) => m.route.id)).toEqual([
      "root",
      "routes/upper",
    ]);
    expect(router.match("/about")).toBeNull();
  });

  test("preserves caseSensitive when patching routes via RouteDiscoveryRuntime", async () => {
    let root = makeEntryRoute({ id: "root", path: "/" });
    let upper = makeEntryRoute({
      id: "routes/upper",
      parentId: "root",
      path: "About",
      caseSensitive: true,
    });
    let manifest: AssetsManifest = {
      url: "/assets/manifest.js",
      version: "v1",
      entry: { module: "/assets/entry.js", imports: [] },
      routes: { root },
    };
    let router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/"] }),
      routes: [{ id: "root", path: "/" }],
    });
    let runtime = new RouteDiscoveryRuntime(
      {
        manifest,
        routeModules: {},
        router,
        context: {
          ssr: true,
          routeDiscovery: { mode: "lazy", manifestPath: "/__manifest" },
          isSpaMode: false,
          basename: "/",
        },
      },
      {
        fetch: async () => Response.json({ "routes/upper": upper }),
      },
    );

    await runtime.discoverRoutes(["/About"]);

    expect(router.match("/About")?.map((m) => m.route.id)).toEqual([
      "root",
      "routes/upper",
    ]);
    expect(router.match("/about")).toBeNull();
  });
});
