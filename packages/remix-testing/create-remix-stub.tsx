import * as React from "react";
import type {
  AssetsManifest,
  EntryContext,
  EntryRoute,
  RouteData,
  RouteManifest,
  RouteModules,
} from "@remix-run/react";
import { RemixEntry } from "@remix-run/react";
import type {
  AgnosticDataRouteObject,
  AgnosticIndexRouteObject,
  AgnosticNonIndexRouteObject,
  AgnosticRouteMatch,
  InitialEntry,
  Location,
  MemoryHistory,
  StaticHandler,
  Update,
} from "@remix-run/server-runtime";
import {
  createMemoryHistory,
  json,
  matchRoutes,
  unstable_createStaticHandler as createStaticHandler,
} from "@remix-run/server-runtime";

type RemixStubOptions = {
  /**
   *  The initial entries in the history stack. This allows you to start a test with
   *  multiple locations already in the history stack (for testing a back navigation, etc.)
   *  The test will default to the last entry in initialEntries if no initialIndex is provided.
   *  e.g. initialEntries={["/home", "/about", "/contact"]}
   */
  initialEntries?: InitialEntry[];

  /**
   *  Used to set the route's initial loader data.
   *  e.g. initialLoaderData={{ "/contact": { locale: "en-US" } }}
   */
  initialLoaderData?: RouteData;

  /**
   *  Used to set the route's initial action data.
   *  e.g. initialActionData={{ "/login": { errors: { email: "invalid email" } }}
   */
  initialActionData?: RouteData;

  /**
   * The initial index in the history stack to render. This allows you to start a test at a specific entry.
   * It defaults to the last entry in initialEntries.
   * e.g.
   *   initialEntries: ["/", "/events/123"]
   *   initialIndex: 1 // start at "/events/123"
   */
  initialIndex?: number;
};

type IndexStubRouteObject = AgnosticIndexRouteObject & {
  element?: React.ReactNode;
  children?: undefined;
};

type NonIndexStubRouteObject = AgnosticNonIndexRouteObject & {
  element?: React.ReactNode;
  children?: StubRouteObject[];
};

// TODO: once Remix is on RR@6.4 we can just use the native type
type StubRouteObject = IndexStubRouteObject | NonIndexStubRouteObject;

type RemixConfigFuture = Partial<EntryContext["future"]>;

export function createRemixStub(
  routes: StubRouteObject[],
  remixConfigFuture?: RemixConfigFuture
) {
  // Setup request handler to handle requests to the mock routes
  let { dataRoutes, queryRoute } = createStaticHandler(routes);
  return function RemixStub({
    initialEntries,
    initialLoaderData = {},
    initialActionData,
    initialIndex,
  }: RemixStubOptions) {
    let historyRef = React.useRef<MemoryHistory>();
    if (historyRef.current == null) {
      historyRef.current = createMemoryHistory({
        initialEntries,
        initialIndex,
        v5Compat: true,
      });
    }

    let history = historyRef.current;

    let [state, dispatch] = React.useReducer(
      (_: Update, update: Update) => update,
      { action: history.action, location: history.location }
    );

    React.useLayoutEffect(() => history.listen(dispatch), [history]);

    // Convert path based ids in user supplied initial loader/action data to data route ids
    let loaderData = convertRouteData(dataRoutes, initialLoaderData);
    let actionData = convertRouteData(dataRoutes, initialActionData);

    // Create mock remix context
    let remixContext = createRemixContext(
      dataRoutes,
      state.location,
      loaderData,
      actionData,
      remixConfigFuture
    );

    // Patch fetch so that mock routes can handle action/loader requests
    monkeyPatchFetch(queryRoute, dataRoutes);

    return (
      <RemixEntry
        context={remixContext}
        action={state.action}
        location={state.location}
        navigator={history}
      />
    );
  };
}

function createRemixContext(
  routes: AgnosticDataRouteObject[],
  currentLocation: Location,
  initialLoaderData?: RouteData,
  initialActionData?: RouteData,
  future?: RemixConfigFuture
): EntryContext {
  let manifest = createManifest(routes);
  let matches = matchRoutes(routes, currentLocation) || [];

  return {
    actionData: initialActionData,
    appState: {
      trackBoundaries: true,
      trackCatchBoundaries: true,
      catchBoundaryRouteId: null,
      renderBoundaryRouteId: null,
      loaderBoundaryRouteId: null,
    },
    future: {
      v2_meta: false,
      ...future,
    },
    matches: convertToEntryRouteMatch(matches),
    routeData: initialLoaderData || {},
    manifest,
    routeModules: createRouteModules(routes),
  };
}

function createManifest(routes: AgnosticDataRouteObject[]): AssetsManifest {
  return {
    routes: createRouteManifest(routes),
    entry: { imports: [], module: "" },
    url: "",
    version: "",
  };
}

function createRouteManifest(
  routes: AgnosticDataRouteObject[],
  manifest?: RouteManifest<EntryRoute>,
  parentId?: string
): RouteManifest<EntryRoute> {
  return routes.reduce((manifest, route) => {
    if (route.children) {
      createRouteManifest(route.children, manifest, route.id);
    }
    manifest[route.id!] = convertToEntryRoute(route, parentId);
    return manifest;
  }, manifest || {});
}

function createRouteModules(
  routes: AgnosticDataRouteObject[],
  routeModules?: RouteModules
): RouteModules {
  return routes.reduce((modules, route) => {
    if (route.children) {
      createRouteModules(route.children, modules);
    }

    modules[route.id!] = {
      CatchBoundary: undefined,
      ErrorBoundary: undefined,
      // @ts-expect-error - types are still `agnostic` here
      default: () => route.element,
      handle: route.handle,
      links: undefined,
      meta: undefined,
      unstable_shouldReload: undefined,
    };
    return modules;
  }, routeModules || {});
}

const originalFetch =
  typeof global !== "undefined" ? global.fetch : window.fetch;

function monkeyPatchFetch(
  queryRoute: StaticHandler["queryRoute"],
  dataRoutes: StaticHandler["dataRoutes"]
) {
  let fetchPatch = async (
    input: RequestInfo | URL,
    init: RequestInit = {}
  ): Promise<Response> => {
    let request = new Request(input, init);
    let url = new URL(request.url);

    // if we have matches, send the request to mock routes via @remix-run/router rather than the normal
    // @remix-run/server-runtime so that stubs can also be used in browser environments.
    let matches = matchRoutes(dataRoutes, url);
    if (matches && matches.length > 0) {
      let response = await queryRoute(request);

      if (response instanceof Response) {
        return response;
      }

      return json(response);
    }

    // if no matches, passthrough to the original fetch as mock routes couldn't handle the request.
    return originalFetch(request, init);
  };

  globalThis.fetch = fetchPatch;
}

function convertToEntryRoute(
  route: AgnosticDataRouteObject,
  parentId?: string
): EntryRoute {
  return {
    id: route.id!,
    index: route.index,
    caseSensitive: route.caseSensitive,
    path: route.path,
    parentId,
    hasAction: !!route.action,
    hasLoader: !!route.loader,
    module: "",
    hasCatchBoundary: false,
    hasErrorBoundary: false,
  };
}

function convertToEntryRouteMatch(
  routes: AgnosticRouteMatch<string, AgnosticDataRouteObject>[]
) {
  return routes.map((match) => {
    return {
      params: match.params,
      pathname: match.pathname,
      route: convertToEntryRoute(match.route),
    };
  });
}

// Converts route data from a path based index to a route id index value.
// e.g. { "/post/:postId": post } to { "0": post }
// TODO: may not need
function convertRouteData(
  routes: AgnosticDataRouteObject[],
  initialRouteData?: RouteData,
  routeData: RouteData = {}
): RouteData | undefined {
  if (!initialRouteData) return undefined;
  return routes.reduce<RouteData>((data, route) => {
    if (route.children) {
      convertRouteData(route.children, initialRouteData, data);
    }
    // Check if any of the initial route data entries match this route
    Object.keys(initialRouteData).forEach((routePath) => {
      if (
        routePath === route.path ||
        // Let '/' refer to the root routes data
        (routePath === "/" && route.id === "0" && !route.path)
      ) {
        data[route.id!] = initialRouteData[routePath];
      }
    });
    return data;
  }, routeData);
}
