import * as React from "react";
import type {
  HydrationState,
  InitialEntry,
  Location,
  MemoryHistory,
  RouteMatch,
  RouteObject,
  Router as DataRouter,
  RouterState,
  To,
} from "@remix-run/router";
import {
  Action as NavigationType,
  createMemoryHistory,
  createMemoryRouter,
  invariant,
  normalizePathname,
  parsePath,
  stripBasename,
  warning,
} from "@remix-run/router";
import { useSyncExternalStore as useSyncExternalStoreShim } from "use-sync-external-store/shim";

import {
  LocationContext,
  NavigationContext,
  Navigator,
  DataRouterContext,
  DataRouterStateContext,
} from "./context";
import {
  useInRouterContext,
  useNavigate,
  useOutlet,
  useRoutes,
  _renderMatches,
} from "./hooks";

let IS_REACT_18 =
  "useSyncExternalStore" in React &&
  window.location.search.indexOf("17") === -1;

// Module-scoped singleton to hold the router.  Extracted from the React lifecycle
// to avoid issues w.r.t. dual initialization fetches in concurrent rendering.
// Data router apps are expected to have a static route tree and are not intended
// to be unmounted/remounted at runtime.
let routerSingleton: DataRouter;

/**
 * Unit-testing-only function to reset the router between tests
 * @private
 */
export function _resetModuleScope() {
  // @ts-expect-error
  routerSingleton = null;
}

export function useRenderDataRouter({
  children,
  fallbackElement,
  createRouter,
}: {
  children?: React.ReactNode;
  fallbackElement?: React.ReactElement;
  createRouter: (routes: RouteObject[]) => DataRouter;
}): React.ReactElement {
  if (!routerSingleton) {
    routerSingleton = createRouter(
      createRoutesFromChildren(children)
    ).initialize();
  }
  let router = routerSingleton;

  // Sync router state to our component state to force re-renders
  let state: RouterState = useSyncExternalStoreShim(
    router.subscribe,
    () => router.state
  );

  let navigator = React.useMemo((): Navigator => {
    return {
      createHref: router.createHref,
      go: (n) => router.navigate(n),
      push: (to, state) => router.navigate(to, { state }),
      replace: (to, state) => router.navigate(to, { replace: true, state }),
    };
  }, [router]);

  if (!state.initialized) {
    return fallbackElement || <DefaultFallbackElement />;
  }

  return (
    <DataRouterContext.Provider value={router}>
      <DataRouterStateContext.Provider value={state}>
        <Router
          location={state.location}
          navigationType={state.historyAction}
          navigator={navigator}
        >
          <Routes children={children} />
        </Router>
      </DataRouterStateContext.Provider>
    </DataRouterContext.Provider>
  );
}

function DefaultFallbackElement() {
  return (
    <>
      <style>{`
        :root {
          --size: 25vh;
        }

        .rr-fallback__flex {
          text-align: center;
          width: 100%;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;  
        }

        .rr-fallback__rotate {
          display: block;
          width: var(--size);
          height: var(--size);
          font-size: var(--size);
          animation-name: spin;
          animation-duration: 1s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          transform: rotate(0deg);
          transform-origin: 50% 50%;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion) {
          .rr-fallback__rotate {
            animation-iteration-count: 0;
          }
        }

        .rr-fallback__cd {
          width: var(--size);
          height: var(--size);
          line-height: var(--size);
          margin-top: 5%;
        }
      `}</style>
      <div className="rr-fallback__flex">
        <div className="rr-fallback__rotate">
          <p className="rr-fallback__cd">💿</p>
        </div>
      </div>
    </>
  );
}

export interface DataMemoryRouterProps {
  children?: React.ReactNode;
  initialEntries?: InitialEntry[];
  initialIndex?: number;
  hydrationData?: HydrationState;
  fallbackElement?: React.ReactElement;
}

export function DataMemoryRouter({
  children,
  initialEntries,
  initialIndex,
  hydrationData,
  fallbackElement,
}: DataMemoryRouterProps): React.ReactElement {
  return useRenderDataRouter({
    children,
    fallbackElement,
    createRouter: (routes) =>
      createMemoryRouter({
        initialEntries,
        initialIndex,
        routes,
        hydrationData,
      }),
  });
}

export interface MemoryRouterProps {
  basename?: string;
  children?: React.ReactNode;
  initialEntries?: InitialEntry[];
  initialIndex?: number;
}

/**
 * A <Router> that stores all entries in memory.
 *
 * @see https://reactrouter.com/docs/en/v6/api#memoryrouter
 */
export function MemoryRouter({
  basename,
  children,
  initialEntries,
  initialIndex,
}: MemoryRouterProps): React.ReactElement {
  let historyRef = React.useRef<MemoryHistory>();
  if (historyRef.current == null) {
    historyRef.current = createMemoryHistory({
      initialEntries,
      initialIndex,
      v5Compat: true,
    });
  }

  let history = historyRef.current;
  let [state, setState] = React.useState({
    action: history.action,
    location: history.location,
  });

  React.useLayoutEffect(() => history.listen(setState), [history]);

  return (
    <Router
      basename={basename}
      children={children}
      location={state.location}
      navigationType={state.action}
      navigator={history}
    />
  );
}

export interface NavigateProps {
  to: To;
  replace?: boolean;
  state?: any;
}

/**
 * Changes the current location.
 *
 * Note: This API is mostly useful in React.Component subclasses that are not
 * able to use hooks. In functional components, we recommend you use the
 * `useNavigate` hook instead.
 *
 * @see https://reactrouter.com/docs/en/v6/api#navigate
 */
export function Navigate({ to, replace, state }: NavigateProps): null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of
    // the router loaded. We can help them understand how to avoid that.
    `<Navigate> may be used only in the context of a <Router> component.`
  );

  warning(
    !React.useContext(NavigationContext).static,
    `<Navigate> must not be used on the initial render in a <StaticRouter>. ` +
      `This is a no-op, but you should modify your code so the <Navigate> is ` +
      `only ever rendered in response to some user interaction or state change.`
  );

  let navigate = useNavigate();
  React.useEffect(() => {
    navigate(to, { replace, state });
  });

  return null;
}

export interface OutletProps {
  context?: unknown;
}

/**
 * Renders the child route's element, if there is one.
 *
 * @see https://reactrouter.com/docs/en/v6/api#outlet
 */
export function Outlet(props: OutletProps): React.ReactElement | null {
  return useOutlet(props.context);
}

interface DataRouteProps {
  id?: RouteObject["id"];
  loader?: RouteObject["loader"];
  action?: RouteObject["action"];
  errorElement?: RouteObject["errorElement"];
  shouldRevalidate?: RouteObject["shouldRevalidate"];
}

export interface RouteProps extends DataRouteProps {
  caseSensitive?: boolean;
  children?: React.ReactNode;
  element?: React.ReactNode | null;
  index?: boolean;
  path?: string;
}

export interface PathRouteProps extends DataRouteProps {
  caseSensitive?: boolean;
  children?: React.ReactNode;
  element?: React.ReactNode | null;
  index?: false;
  path: string;
}

export interface LayoutRouteProps extends DataRouteProps {
  children?: React.ReactNode;
  element?: React.ReactNode | null;
}

export interface IndexRouteProps extends DataRouteProps {
  element?: React.ReactNode | null;
  index: true;
}

/**
 * Declares an element that should be rendered at a certain URL path.
 *
 * @see https://reactrouter.com/docs/en/v6/api#route
 */
export function Route(
  _props: PathRouteProps | LayoutRouteProps | IndexRouteProps
): React.ReactElement | null {
  invariant(
    false,
    `A <Route> is only ever to be used as the child of <Routes> element, ` +
      `never rendered directly. Please wrap your <Route> in a <Routes>.`
  );
}

export interface RouterProps {
  basename?: string;
  children?: React.ReactNode;
  location: Partial<Location> | string;
  navigationType?: NavigationType;
  navigator: Navigator;
  static?: boolean;
}

/**
 * Provides location context for the rest of the app.
 *
 * Note: You usually won't render a <Router> directly. Instead, you'll render a
 * router that is more specific to your environment such as a <BrowserRouter>
 * in web browsers or a <StaticRouter> for server rendering.
 *
 * @see https://reactrouter.com/docs/en/v6/api#router
 */
export function Router({
  basename: basenameProp = "/",
  children = null,
  location: locationProp,
  navigationType = NavigationType.Pop,
  navigator,
  static: staticProp = false,
}: RouterProps): React.ReactElement | null {
  invariant(
    !useInRouterContext(),
    `You cannot render a <Router> inside another <Router>.` +
      ` You should never have more than one in your app.`
  );

  let basename = normalizePathname(basenameProp);
  let navigationContext = React.useMemo(
    () => ({ basename, navigator, static: staticProp }),
    [basename, navigator, staticProp]
  );

  if (typeof locationProp === "string") {
    locationProp = parsePath(locationProp);
  }

  let {
    pathname = "/",
    search = "",
    hash = "",
    state = null,
    key = "default",
  } = locationProp;

  let location = React.useMemo(() => {
    let trailingPathname = stripBasename(pathname, basename);

    if (trailingPathname == null) {
      return null;
    }

    return {
      pathname: trailingPathname,
      search,
      hash,
      state,
      key,
    };
  }, [basename, pathname, search, hash, state, key]);

  warning(
    location != null,
    `<Router basename="${basename}"> is not able to match the URL ` +
      `"${pathname}${search}${hash}" because it does not start with the ` +
      `basename, so the <Router> won't render anything.`
  );

  if (location == null) {
    return null;
  }

  return (
    <NavigationContext.Provider value={navigationContext}>
      <LocationContext.Provider
        children={children}
        value={{ location, navigationType }}
      />
    </NavigationContext.Provider>
  );
}

export interface RoutesProps {
  children?: React.ReactNode;
  location?: Partial<Location> | string;
}

/**
 * A container for a nested tree of <Route> elements that renders the branch
 * that best matches the current location.
 *
 * @see https://reactrouter.com/docs/en/v6/api#routes
 */
export function Routes({
  children,
  location,
}: RoutesProps): React.ReactElement | null {
  return useRoutes(createRoutesFromChildren(children), location);
}

///////////////////////////////////////////////////////////////////////////////
// UTILS
///////////////////////////////////////////////////////////////////////////////

/**
 * Creates a route config from a React "children" object, which is usually
 * either a `<Route>` element or an array of them. Used internally by
 * `<Routes>` to create a route config from its children.
 *
 * @see https://reactrouter.com/docs/en/v6/api#createroutesfromchildren
 */
export function createRoutesFromChildren(
  children: React.ReactNode,
  parentPath: number[] = []
): RouteObject[] {
  let routes: RouteObject[] = [];

  React.Children.forEach(children, (element, index) => {
    if (!React.isValidElement(element)) {
      // Ignore non-elements. This allows people to more easily inline
      // conditionals in their route config.
      return;
    }

    if (element.type === React.Fragment) {
      // Transparently support React.Fragment and its children.
      routes.push.apply(
        routes,
        createRoutesFromChildren(element.props.children, parentPath)
      );
      return;
    }

    invariant(
      element.type === Route,
      `[${
        typeof element.type === "string" ? element.type : element.type.name
      }] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`
    );

    let treePath = [...parentPath, index];
    let route: RouteObject = {
      id: element.props.id || treePath.join("-"),
      caseSensitive: element.props.caseSensitive,
      element: element.props.element,
      index: element.props.index,
      path: element.props.path,
      loader: element.props.loader,
      action: element.props.action,
      errorElement: element.props.errorElement,
      shouldRevalidate: element.props.shouldRevalidate,
      handle: element.props.handle,
    };

    if (element.props.children) {
      route.children = createRoutesFromChildren(
        element.props.children,
        treePath
      );
    }

    routes.push(route);
  });

  return routes;
}

/**
 * Renders the result of `matchRoutes()` into a React element.
 */
export function renderMatches(
  matches: RouteMatch[] | null,
  dataRouterState: DataRouter["state"] | null
): React.ReactElement | null {
  return _renderMatches(matches, undefined, dataRouterState);
}
