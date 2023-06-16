import * as React from "react";
import type { HydrationState, InitialEntry, Router } from "@remix-run/router";
import { UNSAFE_RemixContext as RemixContext } from "@remix-run/react";
import type {
  UNSAFE_FutureConfig as FutureConfig,
  UNSAFE_AssetsManifest as AssetsManifest,
  UNSAFE_EntryRoute as EntryRoute,
  UNSAFE_RouteManifest as RouteManifest,
  UNSAFE_RouteModules as RouteModules,
  UNSAFE_RemixContextObject as RemixContextObject,
} from "@remix-run/react";
import type {
  DataRouteObject,
  IndexRouteObject,
  NonIndexRouteObject,
  RouteObject,
} from "react-router-dom";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type {
  ActionFunction,
  AppLoadContext,
  LoaderFunction,
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
   *  Used to set the route's initial loader and action data.
   *  e.g. hydrationData={{
   *   loaderData: { "/contact": { locale: "en-US" } },
   *   actionData: { "/login": { errors: { email: "invalid email" } }}
   *  }}
   */
  hydrationData?: HydrationState;

  /**
   * The initial index in the history stack to render. This allows you to start a test at a specific entry.
   * It defaults to the last entry in initialEntries.
   * e.g.
   *   initialEntries: ["/", "/events/123"]
   *   initialIndex: 1 // start at "/events/123"
   */
  initialIndex?: number;

  remixConfigFuture?: Partial<FutureConfig>;
};

function patchRoutesWithContext(
  routes: (StubRouteObject | StubDataRouteObject)[],
  context: AppLoadContext
): (RouteObject | DataRouteObject)[] {
  return routes.map((route) => {
    if (route.loader) {
      let loader = route.loader;
      route.loader = (args) => loader({ ...args, context });
    }

    if (route.action) {
      let action = route.action;
      route.action = (args) => action({ ...args, context });
    }

    if (route.children) {
      return {
        ...route,
        children: patchRoutesWithContext(route.children, context),
      };
    }

    return route as RouteObject | DataRouteObject;
  }) as (RouteObject | DataRouteObject)[];
}

interface StubIndexRouteObject
  extends Omit<IndexRouteObject, "loader" | "action"> {
  loader?: LoaderFunction;
  action?: ActionFunction;
}

interface StubNonIndexRouteObject
  extends Omit<NonIndexRouteObject, "loader" | "action"> {
  loader?: LoaderFunction;
  action?: ActionFunction;
}

type StubRouteObject = StubIndexRouteObject | StubNonIndexRouteObject;

type StubDataRouteObject = StubRouteObject & {
  children?: DataRouteObject[];
  id: string;
};

export function createRemixStub(
  routes: (StubRouteObject | StubDataRouteObject)[],
  context: AppLoadContext = {}
) {
  return function RemixStub({
    initialEntries,
    initialIndex,
    hydrationData,
    remixConfigFuture,
  }: RemixStubOptions) {
    let routerRef = React.useRef<Router>();
    let remixContextRef = React.useRef<RemixContextObject>();

    if (routerRef.current == null) {
      // update the routes to include context in the loader/action
      let patched = patchRoutesWithContext(routes, context);

      routerRef.current = createMemoryRouter(patched, {
        initialEntries,
        initialIndex,
        hydrationData,
      });
    }

    if (remixContextRef.current == null) {
      remixContextRef.current = {
        future: {
          v2_dev: false,
          unstable_postcss: false,
          unstable_tailwind: false,
          v2_errorBoundary: false,
          v2_headers: false,
          v2_meta: false,
          v2_normalizeFormMethod: false,
          v2_routeConvention: false,
          ...remixConfigFuture,
        },
        manifest: createManifest(routerRef.current.routes),
        routeModules: createRouteModules(routerRef.current.routes),
      };
    }

    return (
      <RemixContext.Provider value={remixContextRef.current}>
        <RouterProvider router={routerRef.current} />
      </RemixContext.Provider>
    );
  };
}

function createManifest(routes: RouteObject[]): AssetsManifest {
  return {
    routes: createRouteManifest(routes),
    entry: { imports: [], module: "" },
    url: "",
    version: "",
  };
}

function createRouteManifest(
  routes: RouteObject[],
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
  routes: RouteObject[],
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
      shouldRevalidate: undefined,
    };

    return modules;
  }, routeModules || {});
}

function convertToEntryRoute(
  route: RouteObject,
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
