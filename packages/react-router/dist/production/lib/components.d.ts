
import { Action, InitialEntry, Location, To } from "./router/history.js";
import { DataStrategyFunction, IndexRouteObject, LazyRouteFunction, NonIndexRouteObject, Params, PatchRoutesOnNavigationFunction, RouteMatch, RouteObject, UIMatch } from "./router/utils.js";
import { FutureConfig, HydrationState, RelativeRoutingType, Router as Router$1, RouterInit } from "./router/router.js";
import { Navigator } from "./context.js";
import { ClientInstrumentation } from "./router/instrumentation.js";
import * as React$1 from "react";

//#region lib/components.d.ts
declare const hydrationRouteProperties: (keyof RouteObject)[];
/**
 * @category Data Routers
 */
interface MemoryRouterOpts {
  /**
   * Basename path for the application.
   */
  basename?: string;
  /**
   * A function that returns an {@link RouterContextProvider} instance
   * which is provided as the `context` argument to client [`action`](../../start/data/route-object#action)s,
   * [`loader`](../../start/data/route-object#loader)s and [middleware](../../how-to/middleware).
   * This function is called to generate a fresh `context` instance on each
   * navigation or fetcher call.
   */
  getContext?: RouterInit["getContext"];
  /**
   * Future flags to enable for the router.
   */
  future?: Partial<FutureConfig>;
  /**
   * Hydration data to initialize the router with if you have already performed
   * data loading on the server.
   */
  hydrationData?: HydrationState;
  /**
   * Initial entries in the in-memory history stack
   */
  initialEntries?: InitialEntry[];
  /**
   * Index of `initialEntries` the application should initialize to
   */
  initialIndex?: number;
  /**
   * Array of instrumentation objects allowing you to instrument the router and
   * individual routes prior to router initialization (and on any subsequently
   * added routes via `route.lazy` or `patchRoutesOnNavigation`).  This is
   * mostly useful for observability such as wrapping navigations, fetches,
   * as well as route loaders/actions/middlewares with logging and/or performance
   * tracing.  See the [docs](../../how-to/instrumentation) for more information.
   *
   * ```tsx
   * let router = createBrowserRouter(routes, {
   *   instrumentations: [logging]
   * });
   *
   *
   * let logging = {
   *   router({ instrument }) {
   *     instrument({
   *       navigate: (impl, info) => logExecution(`navigate ${info.to}`, impl),
   *       fetch: (impl, info) => logExecution(`fetch ${info.to}`, impl)
   *     });
   *   },
   *   route({ instrument, id }) {
   *     instrument({
   *       middleware: (impl, info) => logExecution(
   *         `middleware ${info.request.url} (route ${id})`,
   *         impl
   *       ),
   *       loader: (impl, info) => logExecution(
   *         `loader ${info.request.url} (route ${id})`,
   *         impl
   *       ),
   *       action: (impl, info) => logExecution(
   *         `action ${info.request.url} (route ${id})`,
   *         impl
   *       ),
   *     })
   *   }
   * };
   *
   * async function logExecution(label: string, impl: () => Promise<void>) {
   *   let start = performance.now();
   *   console.log(`start ${label}`);
   *   await impl();
   *   let duration = Math.round(performance.now() - start);
   *   console.log(`end ${label} (${duration}ms)`);
   * }
   * ```
   */
  instrumentations?: ClientInstrumentation[];
  /**
   * Override the default data strategy of running loaders in parallel -
   * see the [docs](../../how-to/data-strategy) for more information.
   *
   * ```tsx
   * let router = createBrowserRouter(routes, {
   *   async dataStrategy({
   *     matches,
   *     request,
   *     runClientMiddleware,
   *   }) {
   *     const matchesToLoad = matches.filter((m) =>
   *       m.shouldCallHandler(),
   *     );
   *
   *     const results: Record<string, DataStrategyResult> = {};
   *     await runClientMiddleware(() =>
   *       Promise.all(
   *         matchesToLoad.map(async (match) => {
   *           results[match.route.id] = await match.resolve();
   *         }),
   *       ),
   *     );
   *     return results;
   *   },
   * });
   * ```
   */
  dataStrategy?: DataStrategyFunction;
  /**
   * Lazily define portions of the route tree on navigations.
   */
  patchRoutesOnNavigation?: PatchRoutesOnNavigationFunction;
}
/**
 * Create a new {@link DataRouter} that manages the application path using an
 * in-memory [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
 * stack. Useful for non-browser environments without a DOM API.
 *
 * Data Routers should not be held in React state. You should create your router
 * once outside of the React tree and pass it to {@link RouterProvider | `<RouterProvider>`}.
 * You can use `patchRoutesOnNavigation` to add additional routes programmatically.
 *
 * @public
 * @category Data Routers
 * @mode data
 * @param routes Application routes
 * @param opts Options
 * @param {MemoryRouterOpts.basename} opts.basename n/a
 * @param {MemoryRouterOpts.dataStrategy} opts.dataStrategy n/a
 * @param {MemoryRouterOpts.future} opts.future n/a
 * @param {MemoryRouterOpts.getContext} opts.getContext n/a
 * @param {MemoryRouterOpts.hydrationData} opts.hydrationData n/a
 * @param {MemoryRouterOpts.initialEntries} opts.initialEntries n/a
 * @param {MemoryRouterOpts.initialIndex} opts.initialIndex n/a
 * @param {MemoryRouterOpts.instrumentations} opts.instrumentations n/a
 * @param {MemoryRouterOpts.patchRoutesOnNavigation} opts.patchRoutesOnNavigation n/a
 * @returns An initialized {@link DataRouter} to pass to {@link RouterProvider | `<RouterProvider>`}
 */
declare function createMemoryRouter(routes: RouteObject[], opts?: MemoryRouterOpts): Router$1;
/**
 * Function signature for client side error handling for loader/actions errors
 * and rendering errors via `componentDidCatch`
 */
interface ClientOnErrorFunction {
  (error: unknown, info: {
    location: Location;
    params: Params;
    pattern: string;
    errorInfo?: React$1.ErrorInfo;
  }): void;
}
/**
 * @category Types
 */
interface RouterProviderProps {
  /**
   * The {@link DataRouter} instance to use for navigation and data fetching. The
   * router prop should be a single router instance created outside of the React
   * tree. Avoid creating new routers during React renders/re-renders.
   */
  router: Router$1;
  /**
   * The [`ReactDOM.flushSync`](https://react.dev/reference/react-dom/flushSync)
   * implementation to use for flushing updates.
   *
   * You usually don't have to worry about this:
   * - The `RouterProvider` exported from `react-router/dom` handles this internally for you
   * - If you are rendering in a non-DOM environment, you can import
   *   `RouterProvider` from `react-router` and ignore this prop
   */
  flushSync?: <R>(fn: () => R) => R;
  /**
   * An error handler function that will be called for any middleware, loader, action,
   * or render errors that are encountered in your application.  This is useful for
   * logging or reporting errors instead of in the {@link ErrorBoundary} because it's not
   * subject to re-rendering and will only run one time per error.
   *
   * The `errorInfo` parameter is passed along from
   * [`componentDidCatch`](https://react.dev/reference/react/Component#componentdidcatch)
   * and is only present for render errors.
   *
   * ```tsx
   * <RouterProvider onError={(error, info) => {
   *   let { location, params, pattern, errorInfo } = info;
   *   console.error(error, location, errorInfo);
   *   reportToErrorService(error, location, errorInfo);
   * }} />
   * ```
   */
  onError?: ClientOnErrorFunction;
  /**
   * Control whether router state updates are internally wrapped in
   * [`React.startTransition`](https://react.dev/reference/react/startTransition).
   *
   * - When left `undefined`, all state updates are wrapped in
   *   `React.startTransition`
   *   - This can lead to buggy behaviors if you are wrapping your own
   *     navigations/fetchers in `startTransition`.
   * - When set to `true`, {@link Link} and {@link Form} navigations will be wrapped
   *   in `React.startTransition` and router state changes will be wrapped in
   *   `React.startTransition` and also sent through
   *   [`useOptimistic`](https://react.dev/reference/react/useOptimistic) to
   *   surface mid-navigation router state changes to the UI.
   * - When set to `false`, the router will not leverage `React.startTransition` or
   *   `React.useOptimistic` on any navigations or state changes.
   *
   * For more information, please see the [docs](../../explanation/react-transitions).
   */
  useTransitions?: boolean;
}
/**
 * Render the UI for the given {@link DataRouter}. This component should
 * typically be at the top of an app's element tree. The router prop should
 * be a single router instance created outside of the React tree. Avoid
 * creating new routers during React renders/re-renders.
 *
 * ```tsx
 * import { createBrowserRouter } from "react-router";
 * import { RouterProvider } from "react-router/dom";
 * import { createRoot } from "react-dom/client";
 *
 * const router = createBrowserRouter(routes);
 * createRoot(document.getElementById("root")).render(
 *   <RouterProvider router={router} />
 * );
 * ```
 *
 * <docs-info>Please note that this component is exported both from
 * `react-router` and `react-router/dom` with the only difference being that the
 * latter automatically wires up `react-dom`'s [`flushSync`](https://react.dev/reference/react-dom/flushSync)
 * implementation. You _almost always_ want to use the version from
 * `react-router/dom` unless you're running in a non-DOM environment.</docs-info>
 *
 *
 * @public
 * @category Data Routers
 * @mode data
 * @param props Props
 * @param {RouterProviderProps.flushSync} props.flushSync n/a
 * @param {RouterProviderProps.onError} props.onError n/a
 * @param {RouterProviderProps.router} props.router n/a
 * @param {RouterProviderProps.useTransitions} props.useTransitions n/a
 * @returns React element for the rendered router
 */
declare function RouterProvider({
  router,
  flushSync: reactDomFlushSyncImpl,
  onError,
  useTransitions
}: RouterProviderProps): React$1.ReactElement;
/**
 * @category Types
 */
interface MemoryRouterProps {
  /**
   * Application basename
   */
  basename?: string;
  /**
   * Nested {@link Route} elements describing the route tree
   */
  children?: React$1.ReactNode;
  /**
   * Initial entries in the in-memory history stack
   */
  initialEntries?: InitialEntry[];
  /**
   * Index of `initialEntries` the application should initialize to
   */
  initialIndex?: number;
  /**
   * Control whether router state updates are internally wrapped in
   * [`React.startTransition`](https://react.dev/reference/react/startTransition).
   *
   * - When left `undefined`, all router state updates are wrapped in
   *   `React.startTransition`
   * - When set to `true`, {@link Link} and {@link Form} navigations will be wrapped
   *   in `React.startTransition` and all router state updates are wrapped in
   *   `React.startTransition`
   * - When set to `false`, the router will not leverage `React.startTransition`
   *   on any navigations or state changes.
   *
   * For more information, please see the [docs](../../explanation/react-transitions).
   */
  useTransitions?: boolean;
}
/**
 * A declarative {@link Router | `<Router>`} that stores all entries in memory.
 *
 * @public
 * @category Declarative Routers
 * @mode declarative
 * @param props Props
 * @param {MemoryRouterProps.basename} props.basename n/a
 * @param {MemoryRouterProps.children} props.children n/a
 * @param {MemoryRouterProps.initialEntries} props.initialEntries n/a
 * @param {MemoryRouterProps.initialIndex} props.initialIndex n/a
 * @param {MemoryRouterProps.useTransitions} props.useTransitions n/a
 * @returns A declarative in-memory {@link Router | `<Router>`} for client-side
 * routing.
 */
declare function MemoryRouter({
  basename,
  children,
  initialEntries,
  initialIndex,
  useTransitions
}: MemoryRouterProps): React$1.ReactElement;
/**
 * @category Types
 */
interface NavigateProps {
  /**
   * The path to navigate to. This can be a string or a {@link Path} object
   */
  to: To;
  /**
   * Whether to replace the current entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
   * stack
   */
  replace?: boolean;
  /**
   * State to pass to the new {@link Location} to store in [`history.state`](https://developer.mozilla.org/en-US/docs/Web/API/History/state).
   */
  state?: any;
  /**
   * How to interpret relative routing in the `to` prop.
   * See {@link RelativeRoutingType}.
   */
  relative?: RelativeRoutingType;
}
/**
 * A component-based version of {@link useNavigate} to use in a
 * [`React.Component` class](https://react.dev/reference/react/Component) where
 * hooks cannot be used.
 *
 * It's recommended to avoid using this component in favor of {@link useNavigate}.
 *
 * @example
 * <Navigate to="/tasks" />
 *
 * @public
 * @category Components
 * @param props Props
 * @param {NavigateProps.relative} props.relative n/a
 * @param {NavigateProps.replace} props.replace n/a
 * @param {NavigateProps.state} props.state n/a
 * @param {NavigateProps.to} props.to n/a
 * @returns {void}
 *
 */
declare function Navigate({
  to,
  replace,
  state,
  relative
}: NavigateProps): null;
/**
 * @category Types
 */
interface OutletProps {
  /**
   * Provides a context value to the element tree below the outlet. Use when
   * the parent route needs to provide values to child routes.
   *
   * ```tsx
   * <Outlet context={myContextValue} />
   * ```
   *
   * Access the context with {@link useOutletContext}.
   */
  context?: unknown;
}
/**
 * Renders the matching child route of a parent route or nothing if no child
 * route matches.
 *
 * @example
 * import { Outlet } from "react-router";
 *
 * export default function SomeParent() {
 *   return (
 *     <div>
 *       <h1>Parent Content</h1>
 *       <Outlet />
 *     </div>
 *   );
 * }
 *
 * @public
 * @category Components
 * @param props Props
 * @param {OutletProps.context} props.context n/a
 * @returns React element for the rendered outlet or `null` if no child route matches.
 */
declare function Outlet(props: OutletProps): React$1.ReactElement | null;
/**
 * @category Types
 */
interface PathRouteProps {
  /**
   * Whether the path should be case-sensitive. Defaults to `false`.
   */
  caseSensitive?: NonIndexRouteObject["caseSensitive"];
  /**
   * The path pattern to match. If unspecified or empty, then this becomes a
   * layout route.
   */
  path?: NonIndexRouteObject["path"];
  /**
   * The unique identifier for this route (for use with {@link DataRouter}s)
   */
  id?: NonIndexRouteObject["id"];
  /**
   * A function that returns a promise that resolves to the route object.
   * Used for code-splitting routes.
   * See [`lazy`](../../start/data/route-object#lazy).
   */
  lazy?: LazyRouteFunction<NonIndexRouteObject>;
  /**
   * The route middleware.
   * See [`middleware`](../../start/data/route-object#middleware).
   */
  middleware?: NonIndexRouteObject["middleware"];
  /**
   * The route loader.
   * See [`loader`](../../start/data/route-object#loader).
   */
  loader?: NonIndexRouteObject["loader"];
  /**
   * The route action.
   * See [`action`](../../start/data/route-object#action).
   */
  action?: NonIndexRouteObject["action"];
  /**
   * The route shouldRevalidate function.
   * See [`shouldRevalidate`](../../start/data/route-object#shouldRevalidate).
   */
  shouldRevalidate?: NonIndexRouteObject["shouldRevalidate"];
  /**
   * The route handle.
   */
  handle?: NonIndexRouteObject["handle"];
  /**
   * Whether this is an index route.
   */
  index?: false;
  /**
   * Child Route components
   */
  children?: React$1.ReactNode;
  /**
   * The React element to render when this Route matches.
   * Mutually exclusive with `Component`.
   */
  element?: React$1.ReactNode | null;
  /**
   * The React element to render while this router is loading data.
   * Mutually exclusive with `HydrateFallback`.
   */
  hydrateFallbackElement?: React$1.ReactNode | null;
  /**
   * The React element to render at this route if an error occurs.
   * Mutually exclusive with `ErrorBoundary`.
   */
  errorElement?: React$1.ReactNode | null;
  /**
   * The React Component to render when this route matches.
   * Mutually exclusive with `element`.
   */
  Component?: React$1.ComponentType | null;
  /**
   * The React Component to render while this router is loading data.
   * Mutually exclusive with `hydrateFallbackElement`.
   */
  HydrateFallback?: React$1.ComponentType | null;
  /**
   * The React Component to render at this route if an error occurs.
   * Mutually exclusive with `errorElement`.
   */
  ErrorBoundary?: React$1.ComponentType | null;
}
/**
 * @category Types
 */
interface LayoutRouteProps extends PathRouteProps {}
/**
 * @category Types
 */
interface IndexRouteProps {
  /**
   * Whether the path should be case-sensitive. Defaults to `false`.
   */
  caseSensitive?: IndexRouteObject["caseSensitive"];
  /**
   * The path pattern to match. If unspecified or empty, then this becomes a
   * layout route.
   */
  path?: IndexRouteObject["path"];
  /**
   * The unique identifier for this route (for use with {@link DataRouter}s)
   */
  id?: IndexRouteObject["id"];
  /**
   * A function that returns a promise that resolves to the route object.
   * Used for code-splitting routes.
   * See [`lazy`](../../start/data/route-object#lazy).
   */
  lazy?: LazyRouteFunction<IndexRouteObject>;
  /**
   * The route middleware.
   * See [`middleware`](../../start/data/route-object#middleware).
   */
  middleware?: IndexRouteObject["middleware"];
  /**
   * The route loader.
   * See [`loader`](../../start/data/route-object#loader).
   */
  loader?: IndexRouteObject["loader"];
  /**
   * The route action.
   * See [`action`](../../start/data/route-object#action).
   */
  action?: IndexRouteObject["action"];
  /**
   * The route shouldRevalidate function.
   * See [`shouldRevalidate`](../../start/data/route-object#shouldRevalidate).
   */
  shouldRevalidate?: IndexRouteObject["shouldRevalidate"];
  /**
   * The route handle.
   */
  handle?: IndexRouteObject["handle"];
  /**
   * Whether this is an index route.
   */
  index: true;
  /**
   * Child Route components
   */
  children?: undefined;
  /**
   * The React element to render when this Route matches.
   * Mutually exclusive with `Component`.
   */
  element?: React$1.ReactNode | null;
  /**
   * The React element to render while this router is loading data.
   * Mutually exclusive with `HydrateFallback`.
   */
  hydrateFallbackElement?: React$1.ReactNode | null;
  /**
   * The React element to render at this route if an error occurs.
   * Mutually exclusive with `ErrorBoundary`.
   */
  errorElement?: React$1.ReactNode | null;
  /**
   * The React Component to render when this route matches.
   * Mutually exclusive with `element`.
   */
  Component?: React$1.ComponentType | null;
  /**
   * The React Component to render while this router is loading data.
   * Mutually exclusive with `hydrateFallbackElement`.
   */
  HydrateFallback?: React$1.ComponentType | null;
  /**
   * The React Component to render at this route if an error occurs.
   * Mutually exclusive with `errorElement`.
   */
  ErrorBoundary?: React$1.ComponentType | null;
}
/**
 * @category Types
 */
type RouteProps = PathRouteProps | LayoutRouteProps | IndexRouteProps;
/**
 * Configures an element to render when a pattern matches the current location.
 * It must be rendered within a {@link Routes} element. Note that these routes
 * do not participate in data loading, actions, code splitting, or any other
 * route module features.
 *
 * @example
 * // Usually used in a declarative router
 * function App() {
 *   return (
 *     <BrowserRouter>
 *       <Routes>
 *         <Route index element={<StepOne />} />
 *         <Route path="step-2" element={<StepTwo />} />
 *         <Route path="step-3" element={<StepThree />} />
 *       </Routes>
 *    </BrowserRouter>
 *   );
 * }
 *
 * // But can be used with a data router as well if you prefer the JSX notation
 * const routes = createRoutesFromElements(
 *   <>
 *     <Route index loader={step1Loader} Component={StepOne} />
 *     <Route path="step-2" loader={step2Loader} Component={StepTwo} />
 *     <Route path="step-3" loader={step3Loader} Component={StepThree} />
 *   </>
 * );
 *
 * const router = createBrowserRouter(routes);
 *
 * function App() {
 *   return <RouterProvider router={router} />;
 * }
 *
 * @public
 * @category Components
 * @param props Props
 * @param {PathRouteProps.action} props.action n/a
 * @param {PathRouteProps.caseSensitive} props.caseSensitive n/a
 * @param {PathRouteProps.Component} props.Component n/a
 * @param {PathRouteProps.children} props.children n/a
 * @param {PathRouteProps.element} props.element n/a
 * @param {PathRouteProps.ErrorBoundary} props.ErrorBoundary n/a
 * @param {PathRouteProps.errorElement} props.errorElement n/a
 * @param {PathRouteProps.handle} props.handle n/a
 * @param {PathRouteProps.HydrateFallback} props.HydrateFallback n/a
 * @param {PathRouteProps.hydrateFallbackElement} props.hydrateFallbackElement n/a
 * @param {PathRouteProps.id} props.id n/a
 * @param {PathRouteProps.index} props.index n/a
 * @param {PathRouteProps.lazy} props.lazy n/a
 * @param {PathRouteProps.loader} props.loader n/a
 * @param {PathRouteProps.path} props.path n/a
 * @param {PathRouteProps.shouldRevalidate} props.shouldRevalidate n/a
 * @returns {void}
 */
declare function Route(props: RouteProps): React$1.ReactElement | null;
/**
 * @category Types
 */
interface RouterProps {
  /**
   * The base path for the application. This is prepended to all locations
   */
  basename?: string;
  /**
   * Nested {@link Route} elements describing the route tree
   */
  children?: React$1.ReactNode;
  /**
   * The location to match against. Defaults to the current location.
   * This can be a string or a {@link Location} object.
   */
  location: Partial<Location> | string;
  /**
   * The type of navigation that triggered this `location` change.
   * Defaults to {@link NavigationType.Pop}.
   */
  navigationType?: Action;
  /**
   * The navigator to use for navigation. This is usually a history object
   * or a custom navigator that implements the {@link Navigator} interface.
   */
  navigator: Navigator;
  /**
   * Whether this router is static or not (used for SSR). If `true`, the router
   * will not be reactive to location changes.
   */
  static?: boolean;
  /**
   * Control whether router state updates are internally wrapped in
   * [`React.startTransition`](https://react.dev/reference/react/startTransition).
   *
   * - When left `undefined`, all router state updates are wrapped in
   *   `React.startTransition`
   * - When set to `true`, {@link Link} and {@link Form} navigations will be wrapped
   *   in `React.startTransition` and all router state updates are wrapped in
   *   `React.startTransition`
   * - When set to `false`, the router will not leverage `React.startTransition`
   *   on any navigations or state changes.
   *
   * For more information, please see the [docs](../../explanation/react-transitions).
   */
  useTransitions?: boolean;
}
/**
 * Provides location context for the rest of the app.
 *
 * Note: You usually won't render a `<Router>` directly. Instead, you'll render a
 * router that is more specific to your environment such as a {@link BrowserRouter}
 * in web browsers or a {@link ServerRouter} for server rendering.
 *
 * @public
 * @category Declarative Routers
 * @mode declarative
 * @param props Props
 * @param {RouterProps.basename} props.basename n/a
 * @param {RouterProps.children} props.children n/a
 * @param {RouterProps.location} props.location n/a
 * @param {RouterProps.navigationType} props.navigationType n/a
 * @param {RouterProps.navigator} props.navigator n/a
 * @param {RouterProps.static} props.static n/a
 * @param {RouterProps.useTransitions} props.useTransitions n/a
 * @returns React element for the rendered router or `null` if the location does
 * not match the {@link props.basename}
 */
declare function Router({
  basename: basenameProp,
  children,
  location: locationProp,
  navigationType,
  navigator,
  static: staticProp,
  useTransitions
}: RouterProps): React$1.ReactElement | null;
/**
 * @category Types
 */
interface RoutesProps {
  /**
   * Nested {@link Route} elements
   */
  children?: React$1.ReactNode;
  /**
   * The {@link Location} to match against. Defaults to the current location.
   */
  location?: Partial<Location> | string;
}
/**
 * Renders a branch of {@link Route | `<Route>`s} that best matches the current
 * location. Note that these routes do not participate in [data loading](../../start/framework/route-module#loader),
 * [`action`](../../start/framework/route-module#action), code splitting, or
 * any other [route module](../../start/framework/route-module) features.
 *
 * @example
 * import { Route, Routes } from "react-router";
 *
 * <Routes>
 *   <Route index element={<StepOne />} />
 *   <Route path="step-2" element={<StepTwo />} />
 *   <Route path="step-3" element={<StepThree />} />
 * </Routes>
 *
 * @public
 * @category Components
 * @param props Props
 * @param {RoutesProps.children} props.children n/a
 * @param {RoutesProps.location} props.location n/a
 * @returns React element for the rendered routes or `null` if no route matches
 */
declare function Routes({
  children,
  location
}: RoutesProps): React$1.ReactElement | null;
interface AwaitResolveRenderFunction<Resolve = any> {
  (data: Awaited<Resolve>): React$1.ReactNode;
}
/**
 * @category Types
 */
interface AwaitProps<Resolve> {
  /**
   * When using a function, the resolved value is provided as the parameter.
   *
   * ```tsx [2]
   * <Await resolve={reviewsPromise}>
   *   {(resolvedReviews) => <Reviews items={resolvedReviews} />}
   * </Await>
   * ```
   *
   * When using React elements, {@link useAsyncValue} will provide the
   * resolved value:
   *
   * ```tsx [2]
   * <Await resolve={reviewsPromise}>
   *   <Reviews />
   * </Await>
   *
   * function Reviews() {
   *   const resolvedReviews = useAsyncValue();
   *   return <div>...</div>;
   * }
   * ```
   */
  children: React$1.ReactNode | AwaitResolveRenderFunction<Resolve>;
  /**
   * The error element renders instead of the `children` when the [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
   * rejects.
   *
   * ```tsx
   * <Await
   *   errorElement={<div>Oops</div>}
   *   resolve={reviewsPromise}
   * >
   *   <Reviews />
   * </Await>
   * ```
   *
   * To provide a more contextual error, you can use the {@link useAsyncError} in a
   * child component
   *
   * ```tsx
   * <Await
   *   errorElement={<ReviewsError />}
   *   resolve={reviewsPromise}
   * >
   *   <Reviews />
   * </Await>
   *
   * function ReviewsError() {
   *   const error = useAsyncError();
   *   return <div>Error loading reviews: {error.message}</div>;
   * }
   * ```
   *
   * If you do not provide an `errorElement`, the rejected value will bubble up
   * to the nearest route-level [`ErrorBoundary`](../../start/framework/route-module#errorboundary)
   * and be accessible via the {@link useRouteError} hook.
   */
  errorElement?: React$1.ReactNode;
  /**
   * Takes a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
   * returned from a [`loader`](../../start/framework/route-module#loader) to be
   * resolved and rendered.
   *
   * ```tsx
   * import { Await, useLoaderData } from "react-router";
   *
   * export async function loader() {
   *   let reviews = getReviews(); // not awaited
   *   let book = await getBook();
   *   return {
   *     book,
   *     reviews, // this is a promise
   *   };
   * }
   *
   * export default function Book() {
   *   const {
   *     book,
   *     reviews, // this is the same promise
   *   } = useLoaderData();
   *
   *   return (
   *     <div>
   *       <h1>{book.title}</h1>
   *       <p>{book.description}</p>
   *       <React.Suspense fallback={<ReviewsSkeleton />}>
   *         <Await
   *           // and is the promise we pass to Await
   *           resolve={reviews}
   *         >
   *           <Reviews />
   *         </Await>
   *       </React.Suspense>
   *     </div>
   *   );
   * }
   * ```
   */
  resolve: Resolve;
}
/**
 * Used to render promise values with automatic error handling.
 *
 * **Note:** `<Await>` expects to be rendered inside a [`<React.Suspense>`](https://react.dev/reference/react/Suspense)
 *
 * @example
 * import { Await, useLoaderData } from "react-router";
 *
 * export async function loader() {
 *   // not awaited
 *   const reviews = getReviews();
 *   // awaited (blocks the transition)
 *   const book = await fetch("/api/book").then((res) => res.json());
 *   return { book, reviews };
 * }
 *
 * function Book() {
 *   const { book, reviews } = useLoaderData();
 *   return (
 *     <div>
 *       <h1>{book.title}</h1>
 *       <p>{book.description}</p>
 *       <React.Suspense fallback={<ReviewsSkeleton />}>
 *         <Await
 *           resolve={reviews}
 *           errorElement={
 *             <div>Could not load reviews 😬</div>
 *           }
 *           children={(resolvedReviews) => (
 *             <Reviews items={resolvedReviews} />
 *           )}
 *         />
 *       </React.Suspense>
 *     </div>
 *   );
 * }
 *
 * @public
 * @category Components
 * @mode framework
 * @mode data
 * @param props Props
 * @param {AwaitProps.children} props.children n/a
 * @param {AwaitProps.errorElement} props.errorElement n/a
 * @param {AwaitProps.resolve} props.resolve n/a
 * @returns React element for the rendered awaited value
 */
declare function Await<Resolve>({
  children,
  errorElement,
  resolve
}: AwaitProps<Resolve>): React$1.JSX.Element;
/**
 * Creates a route config from a React "children" object, which is usually
 * either a `<Route>` element or an array of them. Used internally by
 * `<Routes>` to create a route config from its children.
 *
 * @category Utils
 * @mode data
 * @param children The React children to convert into a route config
 * @param parentPath The path of the parent route, used to generate unique IDs.
 * @returns An array of {@link RouteObject}s that can be used with a {@link DataRouter}
 */
declare function createRoutesFromChildren(children: React$1.ReactNode, parentPath?: number[]): RouteObject[];
/**
 * Create route objects from JSX elements instead of arrays of objects.
 *
 * @example
 * const routes = createRoutesFromElements(
 *   <>
 *     <Route index loader={step1Loader} Component={StepOne} />
 *     <Route path="step-2" loader={step2Loader} Component={StepTwo} />
 *     <Route path="step-3" loader={step3Loader} Component={StepThree} />
 *   </>
 * );
 *
 * const router = createBrowserRouter(routes);
 *
 * function App() {
 *   return <RouterProvider router={router} />;
 * }
 *
 * @name createRoutesFromElements
 * @public
 * @category Utils
 * @mode data
 * @param children The React children to convert into a route config
 * @param parentPath The path of the parent route, used to generate unique IDs.
 * This is used for internal recursion and is not intended to be used by the
 * application developer.
 * @returns An array of {@link RouteObject}s that can be used with a {@link DataRouter}
 */
declare const createRoutesFromElements: typeof createRoutesFromChildren;
/**
 * Renders the result of {@link matchRoutes} into a React element.
 *
 * @public
 * @category Utils
 * @param matches The array of {@link RouteMatch | route matches} to render
 * @returns A React element that renders the matched routes or `null` if no matches
 */
declare function renderMatches(matches: RouteMatch[] | null): React$1.ReactElement | null;
declare function useRouteComponentProps(): {
  params: Readonly<Params<string>>;
  loaderData: any;
  actionData: any;
  matches: UIMatch<unknown, unknown>[];
};
type RouteComponentProps = ReturnType<typeof useRouteComponentProps>;
type RouteComponentType = React$1.ComponentType<RouteComponentProps>;
declare function WithComponentProps({
  children
}: {
  children: React$1.ReactElement;
}): React$1.ReactElement<unknown, string | React$1.JSXElementConstructor<any>>;
declare function withComponentProps(Component: RouteComponentType): () => React$1.ReactElement<{
  params: Readonly<Params<string>>;
  loaderData: any;
  actionData: any;
  matches: UIMatch<unknown, unknown>[];
}, string | React$1.JSXElementConstructor<any>>;
declare function useHydrateFallbackProps(): {
  params: Readonly<Params<string>>;
  loaderData: any;
  actionData: any;
};
type HydrateFallbackProps = ReturnType<typeof useHydrateFallbackProps>;
type HydrateFallbackType = React$1.ComponentType<HydrateFallbackProps>;
declare function WithHydrateFallbackProps({
  children
}: {
  children: React$1.ReactElement;
}): React$1.ReactElement<unknown, string | React$1.JSXElementConstructor<any>>;
declare function withHydrateFallbackProps(HydrateFallback: HydrateFallbackType): () => React$1.ReactElement<{
  params: Readonly<Params<string>>;
  loaderData: any;
  actionData: any;
}, string | React$1.JSXElementConstructor<any>>;
declare function useErrorBoundaryProps(): {
  params: Readonly<Params<string>>;
  loaderData: any;
  actionData: any;
  error: unknown;
};
type ErrorBoundaryProps = ReturnType<typeof useErrorBoundaryProps>;
type ErrorBoundaryType = React$1.ComponentType<ErrorBoundaryProps>;
declare function WithErrorBoundaryProps({
  children
}: {
  children: React$1.ReactElement;
}): React$1.ReactElement<unknown, string | React$1.JSXElementConstructor<any>>;
declare function withErrorBoundaryProps(ErrorBoundary: ErrorBoundaryType): () => React$1.ReactElement<{
  params: Readonly<Params<string>>;
  loaderData: any;
  actionData: any;
  error: unknown;
}, string | React$1.JSXElementConstructor<any>>;
//#endregion
export { Await, AwaitProps, ClientOnErrorFunction, IndexRouteProps, LayoutRouteProps, MemoryRouter, MemoryRouterOpts, MemoryRouterProps, Navigate, NavigateProps, Outlet, OutletProps, PathRouteProps, Route, RouteProps, Router, RouterProps, RouterProvider, RouterProviderProps, Routes, RoutesProps, WithComponentProps, WithErrorBoundaryProps, WithHydrateFallbackProps, createMemoryRouter, createRoutesFromChildren, createRoutesFromElements, hydrationRouteProperties, renderMatches, withComponentProps, withErrorBoundaryProps, withHydrateFallbackProps };