import * as React from "react";
import type {
  ActionFunction,
  ActionFunctionArgs,
  DataRouteObject,
  IndexRouteObject,
  LoaderFunction,
  LoaderFunctionArgs,
  MiddlewareFunction,
  NonIndexRouteObject,
} from "../../router/utils";
import type { LinksFunction, MetaFunction, RouteModules } from "./routeModules";
import type { InitialEntry } from "../../router/history";
import type { HydrationState } from "../../router/router";
import {
  convertRoutesToDataRoutes,
  RouterContextProvider,
} from "../../router/utils";
import type { AppLoadContext } from "../../server-runtime/data";
import type {
  AssetsManifest,
  FutureConfig,
  FrameworkContextObject,
} from "./entry";
import {
  type RouteComponentType,
  type HydrateFallbackType,
  type ErrorBoundaryType,
  Outlet,
  RouterProvider,
  createMemoryRouter,
  withComponentProps,
  withErrorBoundaryProps,
  withHydrateFallbackProps,
} from "../../components";
import type { EntryRoute } from "./routes";
import { FrameworkContext } from "./components";

interface StubRouteExtensions {
  Component?: RouteComponentType;
  HydrateFallback?: HydrateFallbackType;
  ErrorBoundary?: ErrorBoundaryType;
  loader?: LoaderFunction;
  action?: ActionFunction;
  children?: StubRouteObject[];
  meta?: MetaFunction;
  links?: LinksFunction;
}

interface StubIndexRouteObject
  extends Omit<
      IndexRouteObject,
      | "Component"
      | "HydrateFallback"
      | "ErrorBoundary"
      | "loader"
      | "action"
      | "element"
      | "errorElement"
      | "children"
    >,
    StubRouteExtensions {}

interface StubNonIndexRouteObject
  extends Omit<
      NonIndexRouteObject,
      | "Component"
      | "HydrateFallback"
      | "ErrorBoundary"
      | "loader"
      | "action"
      | "element"
      | "errorElement"
      | "children"
    >,
    StubRouteExtensions {}

type StubRouteObject = StubIndexRouteObject | StubNonIndexRouteObject;

export interface RoutesTestStubProps {
  /**
   *  The initial entries in the history stack. This allows you to start a test with
   *  multiple locations already in the history stack (for testing a back navigation, etc.)
   *  The test will default to the last entry in initialEntries if no initialIndex is provided.
   *  e.g. initialEntries={["/home", "/about", "/contact"]}
   */
  initialEntries?: InitialEntry[];

  /**
   * The initial index in the history stack to render. This allows you to start a test at a specific entry.
   * It defaults to the last entry in initialEntries.
   * e.g.
   *   initialEntries: ["/", "/events/123"]
   *   initialIndex: 1 // start at "/events/123"
   */
  initialIndex?: number;

  /**
   *  Used to set the route's initial loader and action data.
   *  e.g. hydrationData={{
   *   loaderData: { "/contact": { locale: "en-US" } },
   *   actionData: { "/login": { errors: { email: "invalid email" } }}
   *  }}
   */
  hydrationData?: HydrationState;

  /**
   * Future flags mimicking the settings in react-router.config.ts
   */
  future?: Partial<FutureConfig>;
}

/**
 * @category Utils
 */
export function createRoutesStub(
  routes: StubRouteObject[],
  _context?: AppLoadContext | RouterContextProvider,
) {
  return function RoutesTestStub({
    initialEntries,
    initialIndex,
    hydrationData,
    future,
  }: RoutesTestStubProps) {
    let routerRef = React.useRef<ReturnType<typeof createMemoryRouter>>();
    let frameworkContextRef = React.useRef<FrameworkContextObject>();

    if (routerRef.current == null) {
      frameworkContextRef.current = {
        future: {
          unstable_passThroughRequests:
            future?.unstable_passThroughRequests === true,
          unstable_subResourceIntegrity:
            future?.unstable_subResourceIntegrity === true,
          v8_middleware: future?.v8_middleware === true,
          unstable_trailingSlashAwareDataRequests:
            future?.unstable_trailingSlashAwareDataRequests === true,
        },
        manifest: {
          routes: {},
          entry: { imports: [], module: "" },
          url: "",
          version: "",
        },
        routeModules: {},
        ssr: false,
        isSpaMode: false,
        routeDiscovery: { mode: "lazy", manifestPath: "/__manifest" },
      };

      // Update the routes to include context in the loader/action and populate
      // the manifest and routeModules during the walk
      let patched = processRoutes(
        // @ts-expect-error `StubRouteObject` is stricter about `loader`/`action`
        // types compared to `RouteObject`
        convertRoutesToDataRoutes(routes, (r) => r),
        _context !== undefined
          ? _context
          : future?.v8_middleware
            ? new RouterContextProvider()
            : {},
        frameworkContextRef.current.manifest,
        frameworkContextRef.current.routeModules,
      );
      routerRef.current = createMemoryRouter(patched, {
        initialEntries,
        initialIndex,
        hydrationData,
      });
    }

    return (
      <FrameworkContext.Provider value={frameworkContextRef.current}>
        <RouterProvider router={routerRef.current} />
      </FrameworkContext.Provider>
    );
  };
}

function processRoutes(
  routes: StubRouteObject[],
  context: unknown,
  manifest: AssetsManifest,
  routeModules: RouteModules,
  parentId?: string,
): DataRouteObject[] {
  return routes.map((route) => {
    if (!route.id) {
      throw new Error(
        "Expected a route.id in react-router processRoutes() function",
      );
    }

    let newRoute: DataRouteObject = {
      id: route.id,
      path: route.path,
      index: route.index,
      Component: route.Component
        ? withComponentProps(route.Component)
        : undefined,
      HydrateFallback: route.HydrateFallback
        ? withHydrateFallbackProps(route.HydrateFallback)
        : undefined,
      ErrorBoundary: route.ErrorBoundary
        ? withErrorBoundaryProps(route.ErrorBoundary)
        : undefined,
      action: route.action
        ? (args: ActionFunctionArgs) => route.action!({ ...args, context })
        : undefined,
      loader: route.loader
        ? (args: LoaderFunctionArgs) => route.loader!({ ...args, context })
        : undefined,
      middleware: route.middleware
        ? route.middleware.map(
            (mw) =>
              (...args: Parameters<MiddlewareFunction>) =>
                mw(
                  { ...args[0], context: context as RouterContextProvider },
                  args[1],
                ),
          )
        : undefined,
      handle: route.handle,
      shouldRevalidate: route.shouldRevalidate,
    };

    // Add the EntryRoute to the manifest
    let entryRoute: EntryRoute = {
      id: route.id,
      path: route.path,
      index: route.index,
      parentId,
      hasAction: route.action != null,
      hasLoader: route.loader != null,
      // When testing routes, you should be stubbing loader/action/middleware,
      // not trying to re-implement the full loader/clientLoader/SSR/hydration
      // flow. That is better tested via E2E tests.
      hasClientAction: false,
      hasClientLoader: false,
      hasClientMiddleware: false,
      hasErrorBoundary: route.ErrorBoundary != null,
      // any need for these?
      module: "build/stub-path-to-module.js",
      clientActionModule: undefined,
      clientLoaderModule: undefined,
      clientMiddlewareModule: undefined,
      hydrateFallbackModule: undefined,
    };
    manifest.routes[newRoute.id] = entryRoute;

    // Add the route to routeModules
    routeModules[route.id] = {
      default: newRoute.Component || Outlet,
      ErrorBoundary: newRoute.ErrorBoundary || undefined,
      handle: route.handle,
      links: route.links,
      meta: route.meta,
      shouldRevalidate: route.shouldRevalidate,
    };

    if (route.children) {
      newRoute.children = processRoutes(
        route.children,
        context,
        manifest,
        routeModules,
        newRoute.id,
      );
    }

    return newRoute;
  });
}
