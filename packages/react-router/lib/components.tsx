import * as React from "react";
import type { MemoryHistory } from "history";
import {
  Action as NavigationType,
  createMemoryHistory,
  parsePath,
} from "history";
import type {
  InitialEntry,
  RouteMatch,
  RouteObject,
  HydrationState,
  To,
  Location,
  Router as DataRouter,
  LoaderFunctionArgs,
  ActionFunctionArgs,
  RouteData,
} from "@remix-run/router";
import {
  createMemoryRouter,
  invariant,
  normalizePathname,
  stripBasename,
  warning,
} from "@remix-run/router";

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
import { ShouldReloadFunctionArgs } from "@remix-run/router/utils";

type DataState = "empty" | "loading" | "loaded";

export function useRenderDataRouter({
  basename,
  children,
  hydrationData,
  fallbackElement,
  // FIXME: Figure out if we want to use a direct prop or support useRoutes()
  todo_bikeshed_routes,
  createRouter,
}: {
  basename?: string;
  children?: React.ReactNode;
  hydrationData?: HydrationState;
  fallbackElement?: React.ReactElement;
  todo_bikeshed_routes?: RouteObject[];
  createRouter: (routes: RouteObject[]) => DataRouter;
}): React.ReactElement {
  let [dataState, setDataState] = React.useState<DataState>(
    hydrationData == null ? "empty" : "loaded"
  );

  let routes = todo_bikeshed_routes || createRoutesFromChildren(children);
  let [router] = React.useState<DataRouter>(() => createRouter(routes));

  // TODO: For React 18 we can move to useSyncExternalStore via feature detection
  // state = React.useSyncExternalStore(router.subscribe, () => router.state);

  let [state, setState] = React.useState<DataRouter["state"]>(
    () => router.state
  );
  React.useEffect(
    () => router.subscribe((newState) => setState(newState)),
    [router]
  );

  // If we did not SSR, trigger a replacement navigation to ourself for initial
  // data load and then mark us as loaded as soon as we return to idle
  React.useEffect(() => {
    if (dataState === "empty") {
      setDataState("loading");
      router.navigate(router.state.location, { replace: true });
    } else if (
      dataState === "loading" &&
      router.state.transition.state === "idle"
    ) {
      setDataState("loaded");
    }
  }, [router, router.state, dataState]);

  let navigator = React.useMemo((): Navigator => {
    return {
      createHref: router.createHref,
      go: (n) => router.navigate(n),
      push: (to, state) => router.navigate(to, { state }),
      replace: (to, state) => router.navigate(to, { replace: true, state }),
    };
  }, [router]);

  if (dataState !== "loaded") {
    return fallbackElement || <DefaultFallbackElement />;
  }

  return (
    <DataRouterContext.Provider value={router}>
      <DataRouterStateContext.Provider value={state}>
        <Router
          basename={basename}
          location={state.location}
          navigationType={state.historyAction}
          navigator={navigator}
        >
          {todo_bikeshed_routes ? (
            <DataRoutes routes={routes} />
          ) : (
            <Routes children={children} />
          )}
        </Router>
      </DataRouterStateContext.Provider>
    </DataRouterContext.Provider>
  );
}

function DefaultFallbackElement() {
  return (
    <>
      <style>{`
        .ghost {
          font-size: 33vh;
          text-align: center;
          width: 100vh;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: shake 5s ease-in-out both;
          animation-iteration-count: infinite;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          perspective: 100px;
        }

        @media (prefers-reduced-motion) {
          .ghost {
            animation-iteration-count: 0;
          }
        }

        @keyframes shake {
          0%, 50%, 100% {
            transform: translate3d(0, 0, 0);
          }

          12.5% {
            transform: translate3d(5px, 5px, 0);
          }

          25% {
            transform: translate3d(0, 10px, 0);
          }

          37.5% {
            transform: translate3d(-5px, 5px, 0);
          }

          62.5% {
            transform: translate3d(5px, -5px, 0);
          }

          75% {
            transform: translate3d(0, -10px, 0);
          }

          87.5% {
            transform: translate3d(-5px, -5px, 0);
          }
        }
    `}</style>
      <div className="ghost">👻</div>
    </>
  );
}

export interface DataMemoryRouterProps {
  basename?: string;
  children?: React.ReactNode;
  initialEntries?: InitialEntry[];
  initialIndex?: number;
  hydrationData?: HydrationState;
  fallbackElement?: React.ReactElement;
  todo_bikeshed_routes?: RouteObject[];
}

export function DataMemoryRouter({
  basename,
  children,
  initialEntries,
  initialIndex,
  hydrationData,
  fallbackElement,
  todo_bikeshed_routes,
}: DataMemoryRouterProps): React.ReactElement {
  return useRenderDataRouter({
    basename,
    children,
    hydrationData,
    fallbackElement,
    todo_bikeshed_routes,
    createRouter: (routes) =>
      createMemoryRouter({
        basename,
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
    historyRef.current = createMemoryHistory({ initialEntries, initialIndex });
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
  loader?: (args: LoaderFunctionArgs) => Promise<any>;
  action?: (args: ActionFunctionArgs) => Promise<any>;
  exceptionElement?: React.ReactNode;
  shouldReload?: (arg: ShouldReloadFunctionArgs) => boolean;
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

interface DataRoutesProps {
  routes: RouteObject[];
}

// Internal wrapper to render routes provided to a DataRouter via props instead
// of children.  This is primarily to avoid re-calling createRoutesFromChildren
function DataRoutes({ routes }: DataRoutesProps): React.ReactElement | null {
  return useRoutes(routes);
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
      exceptionElement: element.props.exceptionElement,
      shouldReload: element.props.shouldReload,
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
  exceptions?: RouteData | null
): React.ReactElement | null {
  return _renderMatches(matches, undefined, exceptions);
}
