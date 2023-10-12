import type {
  InitialEntry,
  LazyRouteFunction,
  Location,
  MemoryHistory,
  RelativeRoutingType,
  Router as RemixRouter,
  RouterState,
  RouterSubscriber,
  To,
  TrackedPromise,
} from "@remix-run/router";
import {
  AbortedDeferredError,
  Action as NavigationType,
  createMemoryHistory,
  UNSAFE_getPathContributingMatches as getPathContributingMatches,
  UNSAFE_invariant as invariant,
  parsePath,
  resolveTo,
  stripBasename,
  UNSAFE_warning as warning,
} from "@remix-run/router";
import * as React from "react";

import type {
  DataRouteObject,
  IndexRouteObject,
  Navigator,
  NonIndexRouteObject,
  RouteMatch,
  RouteObject,
  ViewTransitionContextObject,
} from "./context";
import {
  AwaitContext,
  DataRouterContext,
  DataRouterStateContext,
  LocationContext,
  NavigationContext,
  RouteContext,
  ViewTransitionContext,
} from "./context";
import {
  _renderMatches,
  useAsyncValue,
  useInRouterContext,
  useLocation,
  useNavigate,
  useOutlet,
  useRoutes,
  useRoutesImpl,
} from "./hooks";

interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition(): void;
}

declare global {
  interface Document {
    startViewTransition(cb: () => Promise<void> | void): ViewTransition;
  }
}

export interface FutureConfig {
  v7_startTransition: boolean;
}

export interface RouterProviderProps {
  fallbackElement?: React.ReactNode;
  router: RemixRouter;
  future?: Partial<FutureConfig>;
}

/**
  Webpack + React 17 fails to compile on any of the following because webpack
  complains that `startTransition` doesn't exist in `React`:
  * import { startTransition } from "react"
  * import * as React from from "react";
    "startTransition" in React ? React.startTransition(() => setState()) : setState()
  * import * as React from from "react";
    "startTransition" in React ? React["startTransition"](() => setState()) : setState()

  Moving it to a constant such as the following solves the Webpack/React 17 issue:
  * import * as React from from "react";
    const START_TRANSITION = "startTransition";
    START_TRANSITION in React ? React[START_TRANSITION](() => setState()) : setState()

  However, that introduces webpack/terser minification issues in production builds
  in React 18 where minification/obfuscation ends up removing the call of
  React.startTransition entirely from the first half of the ternary.  Grabbing
  this exported reference once up front resolves that issue.

  See https://github.com/remix-run/react-router/issues/10579
*/
const START_TRANSITION = "startTransition";
const startTransitionImpl = React[START_TRANSITION];

function startTransitionSafe(cb: () => void) {
  if (startTransitionImpl) {
    startTransitionImpl(cb);
  } else {
    cb();
  }
}

class Deferred<T> {
  status: "pending" | "resolved" | "rejected" = "pending";
  promise: Promise<T>;
  // @ts-expect-error - no initializer
  resolve: (value: T) => void;
  // @ts-expect-error - no initializer
  reject: (reason?: unknown) => void;
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (value) => {
        if (this.status === "pending") {
          this.status = "resolved";
          resolve(value);
        }
      };
      this.reject = (reason) => {
        if (this.status === "pending") {
          this.status = "rejected";
          reject(reason);
        }
      };
    });
  }
}

/**
 * Given a Remix Router instance, render the appropriate UI
 */
export function RouterProvider({
  fallbackElement,
  router,
  future,
}: RouterProviderProps): React.ReactElement {
  let [state, setStateImpl] = React.useState(router.state);
  let [pendingState, setPendingState] = React.useState<RouterState>();
  let [vtContext, setVtContext] = React.useState<ViewTransitionContextObject>({
    isTransitioning: false,
  });
  let [renderDfd, setRenderDfd] = React.useState<Deferred<void>>();
  let [transition, setTransition] = React.useState<ViewTransition>();
  let [interruption, setInterruption] = React.useState<{
    state: RouterState;
    currentLocation: Location;
    nextLocation: Location;
  }>();
  let { v7_startTransition } = future || {};

  let optInStartTransition = React.useCallback(
    (cb: () => void) => {
      if (v7_startTransition) {
        startTransitionSafe(cb);
      } else {
        cb();
      }
    },
    [v7_startTransition]
  );

  let setState = React.useCallback<RouterSubscriber>(
    (
      newState: RouterState,
      { unstable_viewTransitionOpts: viewTransitionOpts }
    ) => {
      if (
        !viewTransitionOpts ||
        router.window == null ||
        typeof router.window.document.startViewTransition !== "function"
      ) {
        // Mid-navigation state update, or startViewTransition isn't available
        optInStartTransition(() => setStateImpl(newState));
      } else if (transition && renderDfd) {
        // Interrupting an in-progress transition, cancel and let everything flush
        // out, and then kick off a new transition from the interruption state
        renderDfd.resolve();
        transition.skipTransition();
        setInterruption({
          state: newState,
          currentLocation: viewTransitionOpts.currentLocation,
          nextLocation: viewTransitionOpts.nextLocation,
        });
      } else {
        // Completed navigation update with opted-in view transitions, let 'er rip
        setPendingState(newState);
        setVtContext({
          isTransitioning: true,
          currentLocation: viewTransitionOpts.currentLocation,
          nextLocation: viewTransitionOpts.nextLocation,
        });
      }
    },
    [optInStartTransition, transition, renderDfd, router.window]
  );

  // Need to use a layout effect here so we are subscribed early enough to
  // pick up on any render-driven redirects/navigations (useEffect/<Navigate>)
  React.useLayoutEffect(() => router.subscribe(setState), [router, setState]);

  // When we start a view transition, create a Deferred we can use for the
  // eventual "completed" render
  React.useEffect(() => {
    if (vtContext.isTransitioning) {
      setRenderDfd(new Deferred<void>());
    }
  }, [vtContext.isTransitioning]);

  // Once the deferred is created, kick off startViewTransition() to update the
  // DOM and then wait on the Deferred to resolve (indicating the DOM update has
  // happened)
  React.useEffect(() => {
    if (renderDfd && pendingState && router.window) {
      let newState = pendingState;
      let renderPromise = renderDfd.promise;
      let transition = router.window.document.startViewTransition(async () => {
        optInStartTransition(() => setStateImpl(newState));
        await renderPromise;
      });
      transition.finished.finally(() => {
        setRenderDfd(undefined);
        setTransition(undefined);
        setPendingState(undefined);
        setVtContext({ isTransitioning: false });
      });
      setTransition(transition);
    }
  }, [optInStartTransition, pendingState, renderDfd, router.window]);

  // When the new location finally renders and is committed to the DOM, this
  // effect will run to resolve the transition
  React.useEffect(() => {
    if (
      renderDfd &&
      pendingState &&
      state.location.key === pendingState.location.key
    ) {
      renderDfd.resolve();
    }
  }, [renderDfd, transition, state.location, pendingState]);

  // If we get interrupted with a new navigation during a transition, we skip
  // the active transition, let it cleanup, then kick it off again here
  React.useEffect(() => {
    if (!vtContext.isTransitioning && interruption) {
      setPendingState(interruption.state);
      setVtContext({
        isTransitioning: true,
        currentLocation: interruption.currentLocation,
        nextLocation: interruption.nextLocation,
      });
      setInterruption(undefined);
    }
  }, [vtContext.isTransitioning, interruption]);

  let navigator = React.useMemo((): Navigator => {
    return {
      createHref: router.createHref,
      encodeLocation: router.encodeLocation,
      go: (n) => router.navigate(n),
      push: (to, state, opts) =>
        router.navigate(to, {
          state,
          preventScrollReset: opts?.preventScrollReset,
        }),
      replace: (to, state, opts) =>
        router.navigate(to, {
          replace: true,
          state,
          preventScrollReset: opts?.preventScrollReset,
        }),
    };
  }, [router]);

  let basename = router.basename || "/";

  let dataRouterContext = React.useMemo(
    () => ({
      router,
      navigator,
      static: false,
      basename,
    }),
    [router, navigator, basename]
  );

  // The fragment and {null} here are important!  We need them to keep React 18's
  // useId happy when we are server-rendering since we may have a <script> here
  // containing the hydrated server-side staticContext (from StaticRouterProvider).
  // useId relies on the component tree structure to generate deterministic id's
  // so we need to ensure it remains the same on the client even though
  // we don't need the <script> tag
  return (
    <>
      <DataRouterContext.Provider value={dataRouterContext}>
        <DataRouterStateContext.Provider value={state}>
          <ViewTransitionContext.Provider value={vtContext}>
            <Router
              basename={basename}
              location={state.location}
              navigationType={state.historyAction}
              navigator={navigator}
            >
              {state.initialized ? (
                <DataRoutes routes={router.routes} state={state} />
              ) : (
                fallbackElement
              )}
            </Router>
          </ViewTransitionContext.Provider>
        </DataRouterStateContext.Provider>
      </DataRouterContext.Provider>
      {null}
    </>
  );
}

function DataRoutes({
  routes,
  state,
}: {
  routes: DataRouteObject[];
  state: RouterState;
}): React.ReactElement | null {
  return useRoutesImpl(routes, undefined, state);
}

export interface MemoryRouterProps {
  basename?: string;
  children?: React.ReactNode;
  initialEntries?: InitialEntry[];
  initialIndex?: number;
  future?: FutureConfig;
}

/**
 * A `<Router>` that stores all entries in memory.
 *
 * @see https://reactrouter.com/router-components/memory-router
 */
export function MemoryRouter({
  basename,
  children,
  initialEntries,
  initialIndex,
  future,
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
  let [state, setStateImpl] = React.useState({
    action: history.action,
    location: history.location,
  });
  let { v7_startTransition } = future || {};
  let setState = React.useCallback(
    (newState: { action: NavigationType; location: Location }) => {
      v7_startTransition && startTransitionImpl
        ? startTransitionImpl(() => setStateImpl(newState))
        : setStateImpl(newState);
    },
    [setStateImpl, v7_startTransition]
  );

  React.useLayoutEffect(() => history.listen(setState), [history, setState]);

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
  relative?: RelativeRoutingType;
}

/**
 * Changes the current location.
 *
 * Note: This API is mostly useful in React.Component subclasses that are not
 * able to use hooks. In functional components, we recommend you use the
 * `useNavigate` hook instead.
 *
 * @see https://reactrouter.com/components/navigate
 */
export function Navigate({
  to,
  replace,
  state,
  relative,
}: NavigateProps): null {
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

  let { matches } = React.useContext(RouteContext);
  let { pathname: locationPathname } = useLocation();
  let navigate = useNavigate();

  // Resolve the path outside of the effect so that when effects run twice in
  // StrictMode they navigate to the same place
  let path = resolveTo(
    to,
    getPathContributingMatches(matches).map((match) => match.pathnameBase),
    locationPathname,
    relative === "path"
  );
  let jsonPath = JSON.stringify(path);

  React.useEffect(
    () => navigate(JSON.parse(jsonPath), { replace, state, relative }),
    [navigate, jsonPath, relative, replace, state]
  );

  return null;
}

export interface OutletProps {
  context?: unknown;
}

/**
 * Renders the child route's element, if there is one.
 *
 * @see https://reactrouter.com/components/outlet
 */
export function Outlet(props: OutletProps): React.ReactElement | null {
  return useOutlet(props.context);
}

export interface PathRouteProps {
  caseSensitive?: NonIndexRouteObject["caseSensitive"];
  path?: NonIndexRouteObject["path"];
  id?: NonIndexRouteObject["id"];
  lazy?: LazyRouteFunction<NonIndexRouteObject>;
  loader?: NonIndexRouteObject["loader"];
  action?: NonIndexRouteObject["action"];
  hasErrorBoundary?: NonIndexRouteObject["hasErrorBoundary"];
  shouldRevalidate?: NonIndexRouteObject["shouldRevalidate"];
  handle?: NonIndexRouteObject["handle"];
  index?: false;
  children?: React.ReactNode;
  element?: React.ReactNode | null;
  errorElement?: React.ReactNode | null;
  Component?: React.ComponentType | null;
  ErrorBoundary?: React.ComponentType | null;
}

export interface LayoutRouteProps extends PathRouteProps {}

export interface IndexRouteProps {
  caseSensitive?: IndexRouteObject["caseSensitive"];
  path?: IndexRouteObject["path"];
  id?: IndexRouteObject["id"];
  lazy?: LazyRouteFunction<IndexRouteObject>;
  loader?: IndexRouteObject["loader"];
  action?: IndexRouteObject["action"];
  hasErrorBoundary?: IndexRouteObject["hasErrorBoundary"];
  shouldRevalidate?: IndexRouteObject["shouldRevalidate"];
  handle?: IndexRouteObject["handle"];
  index: true;
  children?: undefined;
  element?: React.ReactNode | null;
  errorElement?: React.ReactNode | null;
  Component?: React.ComponentType | null;
  ErrorBoundary?: React.ComponentType | null;
}

export type RouteProps = PathRouteProps | LayoutRouteProps | IndexRouteProps;

/**
 * Declares an element that should be rendered at a certain URL path.
 *
 * @see https://reactrouter.com/components/route
 */
export function Route(_props: RouteProps): React.ReactElement | null {
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
 * Note: You usually won't render a `<Router>` directly. Instead, you'll render a
 * router that is more specific to your environment such as a `<BrowserRouter>`
 * in web browsers or a `<StaticRouter>` for server rendering.
 *
 * @see https://reactrouter.com/router-components/router
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

  // Preserve trailing slashes on basename, so we can let the user control
  // the enforcement of trailing slashes throughout the app
  let basename = basenameProp.replace(/^\/*/, "/");
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

  let locationContext = React.useMemo(() => {
    let trailingPathname = stripBasename(pathname, basename);

    if (trailingPathname == null) {
      return null;
    }

    return {
      location: {
        pathname: trailingPathname,
        search,
        hash,
        state,
        key,
      },
      navigationType,
    };
  }, [basename, pathname, search, hash, state, key, navigationType]);

  warning(
    locationContext != null,
    `<Router basename="${basename}"> is not able to match the URL ` +
      `"${pathname}${search}${hash}" because it does not start with the ` +
      `basename, so the <Router> won't render anything.`
  );

  if (locationContext == null) {
    return null;
  }

  return (
    <NavigationContext.Provider value={navigationContext}>
      <LocationContext.Provider children={children} value={locationContext} />
    </NavigationContext.Provider>
  );
}

export interface RoutesProps {
  children?: React.ReactNode;
  location?: Partial<Location> | string;
}

/**
 * A container for a nested tree of `<Route>` elements that renders the branch
 * that best matches the current location.
 *
 * @see https://reactrouter.com/components/routes
 */
export function Routes({
  children,
  location,
}: RoutesProps): React.ReactElement | null {
  return useRoutes(createRoutesFromChildren(children), location);
}

export interface AwaitResolveRenderFunction {
  (data: Awaited<any>): React.ReactNode;
}

export interface AwaitProps {
  children: React.ReactNode | AwaitResolveRenderFunction;
  errorElement?: React.ReactNode;
  resolve: TrackedPromise | any;
}

/**
 * Component to use for rendering lazily loaded data from returning defer()
 * in a loader function
 */
export function Await({ children, errorElement, resolve }: AwaitProps) {
  return (
    <AwaitErrorBoundary resolve={resolve} errorElement={errorElement}>
      <ResolveAwait>{children}</ResolveAwait>
    </AwaitErrorBoundary>
  );
}

type AwaitErrorBoundaryProps = React.PropsWithChildren<{
  errorElement?: React.ReactNode;
  resolve: TrackedPromise | any;
}>;

type AwaitErrorBoundaryState = {
  error: any;
};

enum AwaitRenderStatus {
  pending,
  success,
  error,
}

const neverSettledPromise = new Promise(() => {});

class AwaitErrorBoundary extends React.Component<
  AwaitErrorBoundaryProps,
  AwaitErrorBoundaryState
> {
  constructor(props: AwaitErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(
      "<Await> caught the following error during render",
      error,
      errorInfo
    );
  }

  render() {
    let { children, errorElement, resolve } = this.props;

    let promise: TrackedPromise | null = null;
    let status: AwaitRenderStatus = AwaitRenderStatus.pending;

    if (!(resolve instanceof Promise)) {
      // Didn't get a promise - provide as a resolved promise
      status = AwaitRenderStatus.success;
      promise = Promise.resolve();
      Object.defineProperty(promise, "_tracked", { get: () => true });
      Object.defineProperty(promise, "_data", { get: () => resolve });
    } else if (this.state.error) {
      // Caught a render error, provide it as a rejected promise
      status = AwaitRenderStatus.error;
      let renderError = this.state.error;
      promise = Promise.reject().catch(() => {}); // Avoid unhandled rejection warnings
      Object.defineProperty(promise, "_tracked", { get: () => true });
      Object.defineProperty(promise, "_error", { get: () => renderError });
    } else if ((resolve as TrackedPromise)._tracked) {
      // Already tracked promise - check contents
      promise = resolve;
      status =
        promise._error !== undefined
          ? AwaitRenderStatus.error
          : promise._data !== undefined
          ? AwaitRenderStatus.success
          : AwaitRenderStatus.pending;
    } else {
      // Raw (untracked) promise - track it
      status = AwaitRenderStatus.pending;
      Object.defineProperty(resolve, "_tracked", { get: () => true });
      promise = resolve.then(
        (data: any) =>
          Object.defineProperty(resolve, "_data", { get: () => data }),
        (error: any) =>
          Object.defineProperty(resolve, "_error", { get: () => error })
      );
    }

    if (
      status === AwaitRenderStatus.error &&
      promise._error instanceof AbortedDeferredError
    ) {
      // Freeze the UI by throwing a never resolved promise
      throw neverSettledPromise;
    }

    if (status === AwaitRenderStatus.error && !errorElement) {
      // No errorElement, throw to the nearest route-level error boundary
      throw promise._error;
    }

    if (status === AwaitRenderStatus.error) {
      // Render via our errorElement
      return <AwaitContext.Provider value={promise} children={errorElement} />;
    }

    if (status === AwaitRenderStatus.success) {
      // Render children with resolved value
      return <AwaitContext.Provider value={promise} children={children} />;
    }

    // Throw to the suspense boundary
    throw promise;
  }
}

/**
 * @private
 * Indirection to leverage useAsyncValue for a render-prop API on `<Await>`
 */
function ResolveAwait({
  children,
}: {
  children: React.ReactNode | AwaitResolveRenderFunction;
}) {
  let data = useAsyncValue();
  let toRender = typeof children === "function" ? children(data) : children;
  return <>{toRender}</>;
}

///////////////////////////////////////////////////////////////////////////////
// UTILS
///////////////////////////////////////////////////////////////////////////////

/**
 * Creates a route config from a React "children" object, which is usually
 * either a `<Route>` element or an array of them. Used internally by
 * `<Routes>` to create a route config from its children.
 *
 * @see https://reactrouter.com/utils/create-routes-from-children
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

    let treePath = [...parentPath, index];

    if (element.type === React.Fragment) {
      // Transparently support React.Fragment and its children.
      routes.push.apply(
        routes,
        createRoutesFromChildren(element.props.children, treePath)
      );
      return;
    }

    invariant(
      element.type === Route,
      `[${
        typeof element.type === "string" ? element.type : element.type.name
      }] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`
    );

    invariant(
      !element.props.index || !element.props.children,
      "An index route cannot have child routes."
    );

    let route: RouteObject = {
      id: element.props.id || treePath.join("-"),
      caseSensitive: element.props.caseSensitive,
      element: element.props.element,
      Component: element.props.Component,
      index: element.props.index,
      path: element.props.path,
      loader: element.props.loader,
      action: element.props.action,
      errorElement: element.props.errorElement,
      ErrorBoundary: element.props.ErrorBoundary,
      hasErrorBoundary:
        element.props.ErrorBoundary != null ||
        element.props.errorElement != null,
      shouldRevalidate: element.props.shouldRevalidate,
      handle: element.props.handle,
      lazy: element.props.lazy,
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
  matches: RouteMatch[] | null
): React.ReactElement | null {
  return _renderMatches(matches);
}
