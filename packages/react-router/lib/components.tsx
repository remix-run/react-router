import type {
  FutureConfig,
  HydrationState,
  InitialEntry,
  LazyRouteFunction,
  Location,
  MemoryHistory,
  RelativeRoutingType,
  Router as RemixRouter,
  To,
  TrackedPromise,
  unstable_DataStrategyFunction,
  unstable_AgnosticPatchRoutesOnMissFunction,
} from "./router";
import {
  AbortedDeferredError,
  Action as NavigationType,
  createMemoryHistory,
  createRouter,
  UNSAFE_invariant as invariant,
  parsePath,
  resolveTo,
  stripBasename,
  UNSAFE_warning as warning,
} from "./router";
import * as React from "react";

import type {
  IndexRouteObject,
  Navigator,
  NonIndexRouteObject,
  RouteMatch,
  RouteObject,
} from "./context";
import {
  AwaitContext,
  LocationContext,
  NavigationContext,
  RouteContext,
} from "./context";
import {
  _renderMatches,
  useAsyncValue,
  useInRouterContext,
  useLocation,
  useNavigate,
  useOutlet,
  useRoutes,
} from "./hooks";
import { getResolveToMatches } from "./router/utils";

// TODO: Let's get this back to using an import map and development/production
// condition once we get the rollup build replaced
const ENABLE_DEV_WARNINGS = true;

/**
 * @private
 */
export function mapRouteProperties(route: RouteObject) {
  let updates: Partial<RouteObject> & { hasErrorBoundary: boolean } = {
    // Note: this check also occurs in createRoutesFromChildren so update
    // there if you change this -- please and thank you!
    hasErrorBoundary:
      route.hasErrorBoundary ||
      route.ErrorBoundary != null ||
      route.errorElement != null,
  };

  if (route.Component) {
    if (ENABLE_DEV_WARNINGS) {
      if (route.element) {
        warning(
          false,
          "You should not include both `Component` and `element` on your route - " +
            "`Component` will be used."
        );
      }
    }
    Object.assign(updates, {
      element: React.createElement(route.Component),
      Component: undefined,
    });
  }

  if (route.HydrateFallback) {
    if (ENABLE_DEV_WARNINGS) {
      if (route.hydrateFallbackElement) {
        warning(
          false,
          "You should not include both `HydrateFallback` and `hydrateFallbackElement` on your route - " +
            "`HydrateFallback` will be used."
        );
      }
    }
    Object.assign(updates, {
      hydrateFallbackElement: React.createElement(route.HydrateFallback),
      HydrateFallback: undefined,
    });
  }

  if (route.ErrorBoundary) {
    if (ENABLE_DEV_WARNINGS) {
      if (route.errorElement) {
        warning(
          false,
          "You should not include both `ErrorBoundary` and `errorElement` on your route - " +
            "`ErrorBoundary` will be used."
        );
      }
    }
    Object.assign(updates, {
      errorElement: React.createElement(route.ErrorBoundary),
      ErrorBoundary: undefined,
    });
  }

  return updates;
}

export interface unstable_PatchRoutesOnMissFunction
  extends unstable_AgnosticPatchRoutesOnMissFunction<RouteMatch> {}

/**
 * @category Routers
 */
export function createMemoryRouter(
  routes: RouteObject[],
  opts?: {
    basename?: string;
    future?: Partial<FutureConfig>;
    hydrationData?: HydrationState;
    initialEntries?: InitialEntry[];
    initialIndex?: number;
    unstable_dataStrategy?: unstable_DataStrategyFunction;
    unstable_patchRoutesOnMiss?: unstable_PatchRoutesOnMissFunction;
  }
): RemixRouter {
  return createRouter({
    basename: opts?.basename,
    future: opts?.future,
    history: createMemoryHistory({
      initialEntries: opts?.initialEntries,
      initialIndex: opts?.initialIndex,
    }),
    hydrationData: opts?.hydrationData,
    routes,
    mapRouteProperties,
    unstable_dataStrategy: opts?.unstable_dataStrategy,
    unstable_patchRoutesOnMiss: opts?.unstable_patchRoutesOnMiss,
  }).initialize();
}

/**
 * @category Types
 */
export interface MemoryRouterProps {
  basename?: string;
  children?: React.ReactNode;
  initialEntries?: InitialEntry[];
  initialIndex?: number;
}

/**
 * A `<Router>` that stores all entries in memory.
 *
 * @category Router Components
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
  let [state, setStateImpl] = React.useState({
    action: history.action,
    location: history.location,
  });
  let setState = React.useCallback(
    (newState: { action: NavigationType; location: Location }) => {
      React.startTransition(() => setStateImpl(newState));
    },
    [setStateImpl]
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

/**
 * @category Types
 */
export interface NavigateProps {
  to: To;
  replace?: boolean;
  state?: any;
  relative?: RelativeRoutingType;
}

/**
 * A component-based version of {@link useNavigate} to use in a [`React.Component
 * Class`](https://reactjs.org/docs/react-component.html) where hooks are not
 * able to be used.
 *
 * It's recommended to avoid using this component in favor of {@link useNavigate}
 *
 * @category Components
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

  let { static: isStatic } = React.useContext(NavigationContext);

  warning(
    !isStatic,
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
    getResolveToMatches(matches),
    locationPathname,
    relative === "path"
  );
  let jsonPath = JSON.stringify(path);

  React.useEffect(() => {
    navigate(JSON.parse(jsonPath), { replace, state, relative });
  }, [navigate, jsonPath, relative, replace, state]);

  return null;
}

/**
 * @category Types
 */
export interface OutletProps {
  /**
    Provides a context value to the element tree below the outlet. Use when the parent route needs to provide values to child routes.

    ```tsx
    <Outlet context={myContextValue} />
    ```

    Access the context with {@link useOutletContext}.
   */
  context?: unknown;
}

/**
  Renders the matching child route of a parent route or nothing if no child route matches.

  ```tsx
  import { Outlet } from "react-router"

  export default function SomeParent() {
    return (
      <div>
        <h1>Parent Content</h1>
        <Outlet />
      </div>
    );
  }
  ```

  @category Components
 */
export function Outlet(props: OutletProps): React.ReactElement | null {
  return useOutlet(props.context);
}

/**
 * @category Types
 */
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
  hydrateFallbackElement?: React.ReactNode | null;
  errorElement?: React.ReactNode | null;
  Component?: React.ComponentType | null;
  HydrateFallback?: React.ComponentType | null;
  ErrorBoundary?: React.ComponentType | null;
}

/**
 * @category Types
 */
export interface LayoutRouteProps extends PathRouteProps {}

/**
 * @category Types
 */
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
  hydrateFallbackElement?: React.ReactNode | null;
  errorElement?: React.ReactNode | null;
  Component?: React.ComponentType | null;
  HydrateFallback?: React.ComponentType | null;
  ErrorBoundary?: React.ComponentType | null;
}

export type RouteProps = PathRouteProps | LayoutRouteProps | IndexRouteProps;

/**
 * Configures an element to render when a pattern matches the current location.
 * It must be rendered within a {@link Routes} element. Note that these routes
 * do not participate in data loading, actions, code splitting, or any other
 * route module features.
 *
 * @category Components
 */
export function Route(_props: RouteProps): React.ReactElement | null {
  invariant(
    false,
    `A <Route> is only ever to be used as the child of <Routes> element, ` +
      `never rendered directly. Please wrap your <Route> in a <Routes>.`
  );
}

/**
 * @category Types
 */
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
 * @category Components
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
    () => ({
      basename,
      navigator,
      static: staticProp,
      future: {},
    }),
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

/**
 * @category Types
 */
export interface RoutesProps {
  /**
   * Nested {@link Route} elements
   */
  children?: React.ReactNode;

  /**
   * The location to match against. Defaults to the current location.
   */
  location?: Partial<Location> | string;
}

/**
 Renders a branch of {@link Route | `<Routes>`} that best matches the current
 location. Note that these routes do not participate in data loading, actions,
 code splitting, or any other route module features.

 ```tsx
 import { Routes, Route } from "react-router"

<Routes>
  <Route index element={<StepOne />} />
  <Route path="step-2" element={<StepTwo />} />
  <Route path="step-3" element={<StepThree />}>
</Routes>
 ```

 @category Components
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

/**
 * @category Types
 */
export interface AwaitProps {
  /**
  When using a function, the resolved value is provided as the parameter.

  ```tsx [2]
  <Await resolve={reviewsPromise}>
    {(resolvedReviews) => <Reviews items={resolvedReviews} />}
  </Await>
  ```

  When using React elements, {@link useAsyncValue} will provide the
  resolved value:

  ```tsx [2]
  <Await resolve={reviewsPromise}>
    <Reviews />
  </Await>

  function Reviews() {
    const resolvedReviews = useAsyncValue()
    return <div>...</div>
  }
  ```
  */
  children: React.ReactNode | AwaitResolveRenderFunction;

  /**
  The error element renders instead of the children when the promise rejects.

  ```tsx
  <Await
    errorElement={<div>Oops</div>}
    resolve={reviewsPromise}
  >
    <Reviews />
  </Await>
  ```

  To provide a more contextual error, you can use the {@link useAsyncError} in a
  child component

  ```tsx
  <Await
    errorElement={<ReviewsError />}
    resolve={reviewsPromise}
  >
    <Reviews />
  </Await>

  function ReviewsError() {
    const error = useAsyncError()
    return <div>Error loading reviews: {error.message}</div>
  }
  ```

  If you do not provide an errorElement, the rejected value will bubble up to
  the nearest route-level {@link NonIndexRouteObject#ErrorBoundary | ErrorBoundary} and be accessible
  via {@link useRouteError} hook.
  */
  errorElement?: React.ReactNode;

  /**
  Takes a promise returned from a {@link LoaderFunction | loader} value to be resolved and rendered.

  ```jsx
  import { useLoaderData, Await } from "react-router"

  export async function loader() {
    let reviews = getReviews() // not awaited
    let book = await getBook()
    return {
      book,
      reviews, // this is a promise
    }
  }

  export default function Book() {
    const {
      book,
      reviews, // this is the same promise
    } = useLoaderData()

    return (
      <div>
        <h1>{book.title}</h1>
        <p>{book.description}</p>
        <React.Suspense fallback={<ReviewsSkeleton />}>
          <Await
            // and is the promise we pass to Await
            resolve={reviews}
          >
            <Reviews />
          </Await>
        </React.Suspense>
      </div>
    );
  }
  ```
   */
  resolve: TrackedPromise | any;
}

/**
Used to render promise values with automatic error handling.

```tsx
import { Await, useLoaderData } from "react-router";

export function loader() {
  // not awaited
  const reviews = getReviews()
  // awaited (blocks the transition)
  const book = await fetch("/api/book").then((res) => res.json())
  return { book, reviews }
}

function Book() {
  const { book, reviews } = useLoaderData();
  return (
    <div>
      <h1>{book.title}</h1>
      <p>{book.description}</p>
      <React.Suspense fallback={<ReviewsSkeleton />}>
        <Await
          resolve={reviews}
          errorElement={
            <div>Could not load reviews 😬</div>
          }
          children={(resolvedReviews) => (
            <Reviews items={resolvedReviews} />
          )}
        />
      </React.Suspense>
    </div>
  );
}
```

**Note:** `<Await>` expects to be rendered inside of a `<React.Suspense>`

@category Components

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
        "_error" in promise
          ? AwaitRenderStatus.error
          : "_data" in promise
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
 * @category Utils
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
      hydrateFallbackElement: element.props.hydrateFallbackElement,
      HydrateFallback: element.props.HydrateFallback,
      errorElement: element.props.errorElement,
      ErrorBoundary: element.props.ErrorBoundary,
      hasErrorBoundary:
        element.props.hasErrorBoundary === true ||
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
 *
 * @category Utils
 */
export function renderMatches(
  matches: RouteMatch[] | null
): React.ReactElement | null {
  return _renderMatches(matches);
}
