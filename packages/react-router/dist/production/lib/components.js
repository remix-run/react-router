/**
 * react-router v8.1.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { createMemoryHistory, invariant, parsePath, warning } from "./router/history.js";
import { defaultMapRouteProperties, getResolveToMatches, getRoutePattern, resolveTo, stripBasename } from "./router/utils.js";
import { createRouter } from "./router/router.js";
import { AwaitContext, DataRouterContext, DataRouterStateContext, FetchersContext, LocationContext, NavigationContext, RouteContext, ViewTransitionContext, useIsRSCRouterContext } from "./context.js";
import { _renderMatches, useActionData, useAsyncValue, useInRouterContext, useLoaderData, useLocation, useMatches, useNavigate, useOutlet, useParams, useRouteError, useRoutes, useRoutesImpl } from "./hooks.js";
import { warnOnce } from "./server-runtime/warnings.js";
import * as React$1 from "react";
import { useOptimistic } from "react";
//#region lib/components.tsx
const hydrationRouteProperties = ["HydrateFallback", "hydrateFallbackElement"];
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
function createMemoryRouter(routes, opts) {
	return createRouter({
		basename: opts?.basename,
		getContext: opts?.getContext,
		future: opts?.future,
		history: createMemoryHistory({
			initialEntries: opts?.initialEntries,
			initialIndex: opts?.initialIndex
		}),
		hydrationData: opts?.hydrationData,
		routes,
		mapRouteProperties: defaultMapRouteProperties,
		hydrationRouteProperties,
		dataStrategy: opts?.dataStrategy,
		patchRoutesOnNavigation: opts?.patchRoutesOnNavigation,
		instrumentations: opts?.instrumentations
	}).initialize();
}
var Deferred = class {
	status = "pending";
	promise;
	resolve;
	reject;
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
};
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
function RouterProvider({ router, flushSync: reactDomFlushSyncImpl, onError, useTransitions }) {
	useTransitions = useIsRSCRouterContext() || useTransitions;
	let [_state, setStateImpl] = React$1.useState(router.state);
	let [state, setOptimisticState] = useOptimistic(_state);
	let [pendingState, setPendingState] = React$1.useState();
	let [vtContext, setVtContext] = React$1.useState({ isTransitioning: false });
	let [renderDfd, setRenderDfd] = React$1.useState();
	let [transition, setTransition] = React$1.useState();
	let [interruption, setInterruption] = React$1.useState();
	let fetcherData = React$1.useRef(/* @__PURE__ */ new Map());
	let setState = React$1.useCallback((newState, { deletedFetchers, newErrors, flushSync, viewTransitionOpts }) => {
		if (newErrors && onError) Object.values(newErrors).forEach((error) => onError(error, {
			location: newState.location,
			params: newState.matches[0]?.params ?? {},
			pattern: getRoutePattern(newState.matches)
		}));
		newState.fetchers.forEach((fetcher, key) => {
			if (fetcher.data !== void 0) fetcherData.current.set(key, fetcher.data);
		});
		deletedFetchers.forEach((key) => fetcherData.current.delete(key));
		warnOnce(flushSync === false || reactDomFlushSyncImpl != null, "You provided the `flushSync` option to a router update, but you are not using the `<RouterProvider>` from `react-router/dom` so `ReactDOM.flushSync()` is unavailable.  Please update your app to `import { RouterProvider } from \"react-router/dom\"` and ensure you have `react-dom` installed as a dependency to use the `flushSync` option.");
		let isViewTransitionAvailable = router.window != null && router.window.document != null && typeof router.window.document.startViewTransition === "function";
		warnOnce(viewTransitionOpts == null || isViewTransitionAvailable, "You provided the `viewTransition` option to a router update, but you do not appear to be running in a DOM environment as `window.startViewTransition` is not available.");
		if (!viewTransitionOpts || !isViewTransitionAvailable) {
			if (reactDomFlushSyncImpl && flushSync) reactDomFlushSyncImpl(() => setStateImpl(newState));
			else if (useTransitions === false) setStateImpl(newState);
			else React$1.startTransition(() => {
				if (useTransitions === true) setOptimisticState((s) => getOptimisticRouterState(s, newState));
				setStateImpl(newState);
			});
			return;
		}
		if (reactDomFlushSyncImpl && flushSync) {
			reactDomFlushSyncImpl(() => {
				if (transition) {
					renderDfd?.resolve();
					transition.skipTransition();
				}
				setVtContext({
					isTransitioning: true,
					flushSync: true,
					currentLocation: viewTransitionOpts.currentLocation,
					nextLocation: viewTransitionOpts.nextLocation
				});
			});
			let t = router.window.document.startViewTransition(() => {
				reactDomFlushSyncImpl(() => setStateImpl(newState));
			});
			t.finished.finally(() => {
				reactDomFlushSyncImpl(() => {
					setRenderDfd(void 0);
					setTransition(void 0);
					setPendingState(void 0);
					setVtContext({ isTransitioning: false });
				});
			});
			reactDomFlushSyncImpl(() => setTransition(t));
			return;
		}
		if (transition) {
			renderDfd?.resolve();
			transition.skipTransition();
			setInterruption({
				state: newState,
				currentLocation: viewTransitionOpts.currentLocation,
				nextLocation: viewTransitionOpts.nextLocation
			});
		} else {
			setPendingState(newState);
			setVtContext({
				isTransitioning: true,
				flushSync: false,
				currentLocation: viewTransitionOpts.currentLocation,
				nextLocation: viewTransitionOpts.nextLocation
			});
		}
	}, [
		router.window,
		reactDomFlushSyncImpl,
		transition,
		renderDfd,
		useTransitions,
		setOptimisticState,
		onError
	]);
	React$1.useLayoutEffect(() => router.subscribe(setState), [router, setState]);
	React$1.useEffect(() => {
		if (vtContext.isTransitioning && !vtContext.flushSync) setRenderDfd(new Deferred());
	}, [vtContext]);
	React$1.useEffect(() => {
		if (renderDfd && pendingState && router.window) {
			let newState = pendingState;
			let renderPromise = renderDfd.promise;
			let transition = router.window.document.startViewTransition(async () => {
				if (useTransitions === false) setStateImpl(newState);
				else React$1.startTransition(() => {
					if (useTransitions === true) setOptimisticState((s) => getOptimisticRouterState(s, newState));
					setStateImpl(newState);
				});
				await renderPromise;
			});
			transition.finished.finally(() => {
				setRenderDfd(void 0);
				setTransition(void 0);
				setPendingState(void 0);
				setVtContext({ isTransitioning: false });
			});
			setTransition(transition);
		}
	}, [
		pendingState,
		renderDfd,
		router.window,
		useTransitions,
		setOptimisticState
	]);
	React$1.useEffect(() => {
		if (renderDfd && pendingState && state.location.key === pendingState.location.key) renderDfd.resolve();
	}, [
		renderDfd,
		transition,
		state.location,
		pendingState
	]);
	React$1.useEffect(() => {
		if (!vtContext.isTransitioning && interruption) {
			setPendingState(interruption.state);
			setVtContext({
				isTransitioning: true,
				flushSync: false,
				currentLocation: interruption.currentLocation,
				nextLocation: interruption.nextLocation
			});
			setInterruption(void 0);
		}
	}, [vtContext.isTransitioning, interruption]);
	let navigator = React$1.useMemo(() => {
		return {
			createHref: router.createHref,
			encodeLocation: router.encodeLocation,
			go: (n) => router.navigate(n),
			push: (to, state, opts) => router.navigate(to, {
				state,
				preventScrollReset: opts?.preventScrollReset
			}),
			replace: (to, state, opts) => router.navigate(to, {
				replace: true,
				state,
				preventScrollReset: opts?.preventScrollReset
			})
		};
	}, [router]);
	let basename = router.basename || "/";
	let dataRouterContext = React$1.useMemo(() => ({
		router,
		navigator,
		static: false,
		basename,
		onError
	}), [
		router,
		navigator,
		basename,
		onError
	]);
	return /* @__PURE__ */ React$1.createElement(React$1.Fragment, null, /* @__PURE__ */ React$1.createElement(DataRouterContext.Provider, { value: dataRouterContext }, /* @__PURE__ */ React$1.createElement(DataRouterStateContext.Provider, { value: state }, /* @__PURE__ */ React$1.createElement(FetchersContext.Provider, { value: fetcherData.current }, /* @__PURE__ */ React$1.createElement(ViewTransitionContext.Provider, { value: vtContext }, /* @__PURE__ */ React$1.createElement(Router, {
		basename,
		location: state.location,
		navigationType: state.historyAction,
		navigator,
		useTransitions
	}, /* @__PURE__ */ React$1.createElement(MemoizedDataRoutes, {
		routes: router.routes,
		manifest: router.manifest,
		future: router.future,
		state,
		isStatic: false,
		onError
	})))))), null);
}
function getOptimisticRouterState(currentState, newState) {
	return {
		...currentState,
		navigation: newState.navigation.state !== "idle" ? newState.navigation : currentState.navigation,
		revalidation: newState.revalidation !== "idle" ? newState.revalidation : currentState.revalidation,
		actionData: newState.navigation.state !== "submitting" ? newState.actionData : currentState.actionData,
		fetchers: newState.fetchers
	};
}
const MemoizedDataRoutes = React$1.memo(DataRoutes);
function DataRoutes({ routes, manifest, future, state, isStatic, onError }) {
	return useRoutesImpl(routes, void 0, {
		manifest,
		state,
		isStatic,
		onError,
		future
	});
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
function MemoryRouter({ basename, children, initialEntries, initialIndex, useTransitions }) {
	let historyRef = React$1.useRef(null);
	if (historyRef.current == null) historyRef.current = createMemoryHistory({
		initialEntries,
		initialIndex,
		v5Compat: true
	});
	let history = historyRef.current;
	let [state, setStateImpl] = React$1.useState({
		action: history.action,
		location: history.location
	});
	let setState = React$1.useCallback((newState) => {
		if (useTransitions === false) setStateImpl(newState);
		else React$1.startTransition(() => setStateImpl(newState));
	}, [useTransitions]);
	React$1.useLayoutEffect(() => history.listen(setState), [history, setState]);
	return /* @__PURE__ */ React$1.createElement(Router, {
		basename,
		children,
		location: state.location,
		navigationType: state.action,
		navigator: history,
		useTransitions
	});
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
function Navigate({ to, replace, state, relative }) {
	invariant(useInRouterContext(), `<Navigate> may be used only in the context of a <Router> component.`);
	let { static: isStatic } = React$1.useContext(NavigationContext);
	warning(!isStatic, "<Navigate> must not be used on the initial render in a <StaticRouter>. This is a no-op, but you should modify your code so the <Navigate> is only ever rendered in response to some user interaction or state change.");
	let { matches } = React$1.useContext(RouteContext);
	let { pathname: locationPathname } = useLocation();
	let navigate = useNavigate();
	let path = resolveTo(to, getResolveToMatches(matches), locationPathname, relative === "path");
	let jsonPath = JSON.stringify(path);
	React$1.useEffect(() => {
		navigate(JSON.parse(jsonPath), {
			replace,
			state,
			relative
		});
	}, [
		navigate,
		jsonPath,
		relative,
		replace,
		state
	]);
	return null;
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
function Outlet(props) {
	return useOutlet(props.context);
}
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
function Route(props) {
	invariant(false, "A <Route> is only ever to be used as the child of <Routes> element, never rendered directly. Please wrap your <Route> in a <Routes>.");
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
function Router({ basename: basenameProp = "/", children = null, location: locationProp, navigationType = "POP", navigator, static: staticProp = false, useTransitions }) {
	invariant(!useInRouterContext(), "You cannot render a <Router> inside another <Router>. You should never have more than one in your app.");
	let basename = basenameProp.replace(/^\/*/, "/");
	let navigationContext = React$1.useMemo(() => ({
		basename,
		navigator,
		static: staticProp,
		useTransitions,
		future: {}
	}), [
		basename,
		navigator,
		staticProp,
		useTransitions
	]);
	if (typeof locationProp === "string") locationProp = parsePath(locationProp);
	let { pathname = "/", search = "", hash = "", state = null, key = "default", mask } = locationProp;
	let locationContext = React$1.useMemo(() => {
		let trailingPathname = stripBasename(pathname, basename);
		if (trailingPathname == null) return null;
		return {
			location: {
				pathname: trailingPathname,
				search,
				hash,
				state,
				key,
				mask
			},
			navigationType
		};
	}, [
		basename,
		pathname,
		search,
		hash,
		state,
		key,
		navigationType,
		mask
	]);
	warning(locationContext != null, `<Router basename="${basename}"> is not able to match the URL "${pathname}${search}${hash}" because it does not start with the basename, so the <Router> won't render anything.`);
	if (locationContext == null) return null;
	return /* @__PURE__ */ React$1.createElement(NavigationContext.Provider, { value: navigationContext }, /* @__PURE__ */ React$1.createElement(LocationContext.Provider, {
		children,
		value: locationContext
	}));
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
function Routes({ children, location }) {
	return useRoutes(createRoutesFromChildren(children), location);
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
function Await({ children, errorElement, resolve }) {
	let dataRouterContext = React$1.useContext(DataRouterContext);
	let dataRouterStateContext = React$1.useContext(DataRouterStateContext);
	let onError = React$1.useCallback((error, errorInfo) => {
		if (dataRouterContext && dataRouterContext.onError && dataRouterStateContext) dataRouterContext.onError(error, {
			location: dataRouterStateContext.location,
			params: dataRouterStateContext.matches[0]?.params || {},
			pattern: getRoutePattern(dataRouterStateContext.matches),
			errorInfo
		});
	}, [dataRouterContext, dataRouterStateContext]);
	return /* @__PURE__ */ React$1.createElement(AwaitErrorBoundary, {
		resolve,
		errorElement,
		onError
	}, /* @__PURE__ */ React$1.createElement(ResolveAwait, null, children));
}
var AwaitErrorBoundary = class extends React$1.Component {
	constructor(props) {
		super(props);
		this.state = { error: null };
	}
	static getDerivedStateFromError(error) {
		return { error };
	}
	componentDidCatch(error, errorInfo) {
		if (this.props.onError) this.props.onError(error, errorInfo);
		else console.error("<Await> caught the following error during render", error, errorInfo);
	}
	render() {
		let { children, errorElement, resolve } = this.props;
		let promise = null;
		let status = 0;
		if (!(resolve instanceof Promise)) {
			status = 1;
			promise = Promise.resolve();
			Object.defineProperty(promise, "_tracked", { get: () => true });
			Object.defineProperty(promise, "_data", { get: () => resolve });
		} else if (this.state.error) {
			status = 2;
			let renderError = this.state.error;
			promise = Promise.reject().catch(() => {});
			Object.defineProperty(promise, "_tracked", { get: () => true });
			Object.defineProperty(promise, "_error", { get: () => renderError });
		} else if (resolve._tracked) {
			promise = resolve;
			status = "_error" in promise ? 2 : "_data" in promise ? 1 : 0;
		} else {
			status = 0;
			Object.defineProperty(resolve, "_tracked", { get: () => true });
			promise = resolve.then((data) => Object.defineProperty(resolve, "_data", { get: () => data }), (error) => {
				this.props.onError?.(error);
				Object.defineProperty(resolve, "_error", { get: () => error });
			});
		}
		if (status === 2 && !errorElement) throw promise._error;
		if (status === 2) return /* @__PURE__ */ React$1.createElement(AwaitContext.Provider, {
			value: promise,
			children: errorElement
		});
		if (status === 1) return /* @__PURE__ */ React$1.createElement(AwaitContext.Provider, {
			value: promise,
			children
		});
		throw promise;
	}
};
function ResolveAwait({ children }) {
	let data = useAsyncValue();
	let toRender = typeof children === "function" ? children(data) : children;
	return /* @__PURE__ */ React$1.createElement(React$1.Fragment, null, toRender);
}
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
function createRoutesFromChildren(children, parentPath = []) {
	let routes = [];
	React$1.Children.forEach(children, (element, index) => {
		if (!React$1.isValidElement(element)) return;
		let treePath = [...parentPath, index];
		if (element.type === React$1.Fragment) {
			routes.push.apply(routes, createRoutesFromChildren(element.props.children, treePath));
			return;
		}
		invariant(element.type === Route, `[${typeof element.type === "string" ? element.type : element.type.name}] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`);
		let props = element.props;
		invariant(!props.index || !props.children, "An index route cannot have child routes.");
		let route = {
			id: props.id || treePath.join("-"),
			caseSensitive: props.caseSensitive,
			element: props.element,
			Component: props.Component,
			index: props.index,
			path: props.path,
			middleware: props.middleware,
			loader: props.loader,
			action: props.action,
			hydrateFallbackElement: props.hydrateFallbackElement,
			HydrateFallback: props.HydrateFallback,
			errorElement: props.errorElement,
			ErrorBoundary: props.ErrorBoundary,
			shouldRevalidate: props.shouldRevalidate,
			handle: props.handle,
			lazy: props.lazy
		};
		if (props.children) route.children = createRoutesFromChildren(props.children, treePath);
		routes.push(route);
	});
	return routes;
}
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
const createRoutesFromElements = createRoutesFromChildren;
/**
* Renders the result of {@link matchRoutes} into a React element.
*
* @public
* @category Utils
* @param matches The array of {@link RouteMatch | route matches} to render
* @returns A React element that renders the matched routes or `null` if no matches
*/
function renderMatches(matches) {
	return _renderMatches(matches);
}
function useRouteComponentProps() {
	return {
		params: useParams(),
		loaderData: useLoaderData(),
		actionData: useActionData(),
		matches: useMatches()
	};
}
function WithComponentProps({ children }) {
	const props = useRouteComponentProps();
	return React$1.cloneElement(children, props);
}
function withComponentProps(Component) {
	return function WithComponentProps() {
		const props = useRouteComponentProps();
		return React$1.createElement(Component, props);
	};
}
function useHydrateFallbackProps() {
	return {
		params: useParams(),
		loaderData: useLoaderData(),
		actionData: useActionData()
	};
}
function WithHydrateFallbackProps({ children }) {
	const props = useHydrateFallbackProps();
	return React$1.cloneElement(children, props);
}
function withHydrateFallbackProps(HydrateFallback) {
	return function WithHydrateFallbackProps() {
		const props = useHydrateFallbackProps();
		return React$1.createElement(HydrateFallback, props);
	};
}
function useErrorBoundaryProps() {
	return {
		params: useParams(),
		loaderData: useLoaderData(),
		actionData: useActionData(),
		error: useRouteError()
	};
}
function WithErrorBoundaryProps({ children }) {
	const props = useErrorBoundaryProps();
	return React$1.cloneElement(children, props);
}
function withErrorBoundaryProps(ErrorBoundary) {
	return function WithErrorBoundaryProps() {
		const props = useErrorBoundaryProps();
		return React$1.createElement(ErrorBoundary, props);
	};
}
//#endregion
export { Await, DataRoutes, MemoryRouter, Navigate, Outlet, Route, Router, RouterProvider, Routes, WithComponentProps, WithErrorBoundaryProps, WithHydrateFallbackProps, createMemoryRouter, createRoutesFromChildren, createRoutesFromElements, hydrationRouteProperties, renderMatches, withComponentProps, withErrorBoundaryProps, withHydrateFallbackProps };
