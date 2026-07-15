/**
 * react-router v8.2.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { invariant, parsePath, warning } from "./router/history.js";
import { convertRouteMatchToUiMatch, decodePath, getResolveToMatches, getRoutePattern, isBrowser, isRouteErrorResponse, joinPaths, matchPath, matchRoutes, parseToInfo, resolveTo, stripBasename } from "./router/utils.js";
import { IDLE_BLOCKER, hasInvalidProtocol } from "./router/router.js";
import { AwaitContext, DataRouterContext, DataRouterStateContext, LocationContext, NavigationContext, RSCRouterContext, RouteContext, RouteErrorContext } from "./context.js";
import { decodeRedirectErrorDigest, decodeRouteErrorResponseDigest } from "./errors.js";
import * as React$1 from "react";
//#region lib/hooks.tsx
/**
* Resolves a URL against the current {@link Location}.
*
* @example
* import { useHref } from "react-router";
*
* function SomeComponent() {
*   let href = useHref("some/where");
*   // "/resolved/some/where"
* }
*
* @public
* @category Hooks
* @param to The path to resolve
* @param options Options
* @param options.relative Defaults to `"route"` so routing is relative to the
* route tree.
* Set to `"path"` to make relative routing operate against path segments.
* @returns The resolved href string
*/
function useHref(to, { relative } = {}) {
	invariant(useInRouterContext(), `useHref() may be used only in the context of a <Router> component.`);
	let { basename, navigator } = React$1.useContext(NavigationContext);
	let { hash, pathname, search } = useResolvedPath(to, { relative });
	let joinedPathname = pathname;
	if (basename !== "/") joinedPathname = pathname === "/" ? basename : joinPaths([basename, pathname]);
	return navigator.createHref({
		pathname: joinedPathname,
		search,
		hash
	});
}
/**
* Returns `true` if this component is a descendant of a {@link Router}, useful
* to ensure a component is used within a {@link Router}.
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @returns Whether the component is within a {@link Router} context
*/
function useInRouterContext() {
	return React$1.useContext(LocationContext) != null;
}
/**
* Returns the current {@link Location}. This can be useful if you'd like to
* perform some side effect whenever it changes.
*
* @example
* import * as React from 'react'
* import { useLocation } from 'react-router'
*
* function SomeComponent() {
*   let location = useLocation()
*
*   React.useEffect(() => {
*     // Google Analytics
*     ga('send', 'pageview')
*   }, [location]);
*
*   return (
*     // ...
*   );
* }
*
* @public
* @category Hooks
* @returns The current {@link Location} object
*/
function useLocation() {
	invariant(useInRouterContext(), `useLocation() may be used only in the context of a <Router> component.`);
	return React$1.useContext(LocationContext).location;
}
/**
* Returns the current {@link Navigation} action which describes how the router
* came to the current {@link Location}, either by a pop, push, or replace on
* the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History) stack.
*
* @public
* @category Hooks
* @returns The current {@link NavigationType} (`"POP"`, `"PUSH"`, or `"REPLACE"`)
*/
function useNavigationType() {
	return React$1.useContext(LocationContext).navigationType;
}
/**
* Returns a {@link PathMatch} object if the given pattern matches the current URL.
* This is useful for components that need to know "active" state, e.g.
* {@link NavLink | `<NavLink>`}.
*
* @public
* @category Hooks
* @param pattern The pattern to match against the current {@link Location}
* @returns The path match object if the pattern matches, `null` otherwise
*/
function useMatch(pattern) {
	invariant(useInRouterContext(), `useMatch() may be used only in the context of a <Router> component.`);
	let { pathname } = useLocation();
	return React$1.useMemo(() => matchPath(pattern, decodePath(pathname)), [pathname, pattern]);
}
const navigateEffectWarning = "You should call navigate() in a React.useEffect(), not when your component is first rendered.";
/**
* Returns a function that lets you navigate programmatically in the browser in
* response to user interactions or effects.
*
* It's often better to use {@link redirect} in [`action`](../../start/framework/route-module#action)/[`loader`](../../start/framework/route-module#loader)
* functions than this hook.
*
* The returned function signature is `navigate(to, options?)`/`navigate(delta)` where:
*
* * `to` can be a string path, a {@link To} object, or a number (delta)
* * `options` contains options for modifying the navigation
*   * These options work in all modes (Framework, Data, and Declarative):
*     * `relative`: `"route"` or `"path"` to control relative routing logic
*     * `replace`: Replace the current entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History) stack
*     * `state`: Optional [`history.state`](https://developer.mozilla.org/en-US/docs/Web/API/History/state) to include with the new {@link Location}
*   * These options only work in Framework and Data modes:
*     * `flushSync`: Wrap the DOM updates in [`ReactDom.flushSync`](https://react.dev/reference/react-dom/flushSync)
*     * `preventScrollReset`: Do not scroll back to the top of the page after navigation
*     * `viewTransition`: Enable [`document.startViewTransition`](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition) for this navigation
*
* @example
* import { useNavigate } from "react-router";
*
* function SomeComponent() {
*   let navigate = useNavigate();
*   return (
*     <button onClick={() => navigate(-1)}>
*       Go Back
*     </button>
*   );
* }
*
* @additionalExamples
* ### Navigate to another path
*
* ```tsx
* navigate("/some/route");
* navigate("/some/route?search=param");
* ```
*
* ### Navigate with a {@link To} object
*
* All properties are optional.
*
* ```tsx
* navigate(
*   {
*     pathname: "/some/route",
*     search: "?search=param",
*     hash: "#hash",
*   },
*   {
*     state: { some: "state" },
*   },
* );
* ```
*
* If you use `state`, that will be available on the {@link Location} object on
* the next page. Access it with `useLocation().state` (see {@link useLocation}).
*
* ### Navigate back or forward in the history stack
*
* ```tsx
* // back
* // often used to close modals
* navigate(-1);
*
* // forward
* // often used in a multistep wizard workflows
* navigate(1);
* ```
*
* Be cautious with `navigate(number)`. If your application can load up to a
* route that has a button that tries to navigate forward/back, there may not be
* a [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
* entry to go back or forward to, or it can go somewhere you don't expect
* (like a different domain).
*
* Only use this if you're sure they will have an entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
* stack to navigate to.
*
* ### Replace the current entry in the history stack
*
* This will remove the current entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
* stack, replacing it with a new one, similar to a server side redirect.
*
* ```tsx
* navigate("/some/route", { replace: true });
* ```
*
* ### Prevent Scroll Reset
*
* [MODES: framework, data]
*
* <br/>
* <br/>
*
* To prevent {@link ScrollRestoration | `<ScrollRestoration>`} from resetting
* the scroll position, use the `preventScrollReset` option.
*
* ```tsx
* navigate("?some-tab=1", { preventScrollReset: true });
* ```
*
* For example, if you have a tab interface connected to search params in the
* middle of a page, and you don't want it to scroll to the top when a tab is
* clicked.
*
* ### Return Type Augmentation
*
* Internally, `useNavigate` uses a separate implementation when you are in
* Declarative mode versus Data/Framework mode - the primary difference being
* that the latter is able to return a stable reference that does not change
* identity across navigations. The implementation in Data/Framework mode also
* returns a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
* that resolves when the navigation is completed. This means the return type of
* `useNavigate` is `void | Promise<void>`. This is accurate, but can lead to
* some red squigglies based on the union in the return value:
*
* - If you're using `typescript-eslint`, you may see errors from
*   [`@typescript-eslint/no-floating-promises`](https://typescript-eslint.io/rules/no-floating-promises)
* - In Framework/Data mode, `React.use(navigate())` will show a false-positive
*   `Argument of type 'void | Promise<void>' is not assignable to parameter of
*   type 'Usable<void>'` error
*
* The easiest way to work around these issues is to augment the type based on the
* router you're using:
*
* ```ts
* // If using <BrowserRouter>
* declare module "react-router" {
*   interface NavigateFunction {
*     (to: To, options?: NavigateOptions): void;
*     (delta: number): void;
*   }
* }
*
* // If using <RouterProvider> or Framework mode
* declare module "react-router" {
*   interface NavigateFunction {
*     (to: To, options?: NavigateOptions): Promise<void>;
*     (delta: number): Promise<void>;
*   }
* }
* ```
*
* @public
* @category Hooks
* @returns A navigate function for programmatic navigation
*/
function useNavigate() {
	let { isDataRoute } = React$1.useContext(RouteContext);
	return isDataRoute ? useNavigateStable() : useNavigateUnstable();
}
function useNavigateUnstable() {
	invariant(useInRouterContext(), `useNavigate() may be used only in the context of a <Router> component.`);
	let dataRouterContext = React$1.useContext(DataRouterContext);
	let { basename, navigator } = React$1.useContext(NavigationContext);
	let { matches } = React$1.useContext(RouteContext);
	let { pathname: locationPathname } = useLocation();
	let routePathnamesJson = JSON.stringify(getResolveToMatches(matches));
	let activeRef = React$1.useRef(false);
	React$1.useLayoutEffect(() => {
		activeRef.current = true;
	});
	return React$1.useCallback((to, options = {}) => {
		warning(activeRef.current, navigateEffectWarning);
		if (!activeRef.current) return;
		if (typeof to === "number") {
			navigator.go(to);
			return;
		}
		let path = resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, options.relative === "path");
		if (dataRouterContext == null && basename !== "/") path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
		(!!options.replace ? navigator.replace : navigator.push)(path, options.state, options);
	}, [
		basename,
		navigator,
		routePathnamesJson,
		locationPathname,
		dataRouterContext
	]);
}
const OutletContext = React$1.createContext(null);
/**
* Returns the parent route {@link Outlet | `<Outlet context>`}.
*
* Often parent routes manage state or other values you want shared with child
* routes. You can create your own [context provider](https://react.dev/learn/passing-data-deeply-with-context)
* if you like, but this is such a common situation that it's built-into
* {@link Outlet | `<Outlet>`}.
*
* ```tsx
* // Parent route
* function Parent() {
*   const [count, setCount] = React.useState(0);
*   return <Outlet context={[count, setCount]} />;
* }
* ```
*
* ```tsx
* // Child route
* import { useOutletContext } from "react-router";
*
* function Child() {
*   const [count, setCount] = useOutletContext();
*   const increment = () => setCount((c) => c + 1);
*   return <button onClick={increment}>{count}</button>;
* }
* ```
*
* If you're using TypeScript, we recommend the parent component provide a
* custom hook for accessing the context value. This makes it easier for
* consumers to get nice typings, control consumers, and know who's consuming
* the context value.
*
* Here's a more realistic example:
*
* ```tsx filename=src/routes/dashboard.tsx lines=[14,20]
* import { useState } from "react";
* import { Outlet, useOutletContext } from "react-router";
*
* import type { User } from "./types";
*
* type ContextType = { user: User | null };
*
* export default function Dashboard() {
*   const [user, setUser] = useState<User | null>(null);
*
*   return (
*     <div>
*       <h1>Dashboard</h1>
*       <Outlet context={{ user } satisfies ContextType} />
*     </div>
*   );
* }
*
* export function useUser() {
*   return useOutletContext<ContextType>();
* }
* ```
*
* ```tsx filename=src/routes/dashboard/messages.tsx lines=[1,4]
* import { useUser } from "../dashboard";
*
* export default function DashboardMessages() {
*   const { user } = useUser();
*   return (
*     <div>
*       <h2>Messages</h2>
*       <p>Hello, {user.name}!</p>
*     </div>
*   );
* }
* ```
*
* @public
* @category Hooks
* @returns The context value passed to the parent {@link Outlet} component
*/
function useOutletContext() {
	return React$1.useContext(OutletContext);
}
/**
* Returns the element for the child route at this level of the route
* hierarchy. Used internally by {@link Outlet | `<Outlet>`} to render child
* routes.
*
* @public
* @category Hooks
* @param context The context to pass to the outlet
* @returns The child route element or `null` if no child routes match
*/
function useOutlet(context) {
	let outlet = React$1.useContext(RouteContext).outlet;
	return React$1.useMemo(() => outlet && /* @__PURE__ */ React$1.createElement(OutletContext.Provider, { value: context }, outlet), [outlet, context]);
}
/**
* Returns an object of key/value-pairs of the dynamic params from the current
* URL that were matched by the routes. Child routes inherit all params from
* their parent routes.
*
* Assuming a route pattern like `/posts/:postId` is matched by `/posts/123`
* then `params.postId` will be `"123"`.
*
* @example
* import { useParams } from "react-router";
*
* function SomeComponent() {
*   let params = useParams();
*   params.postId;
* }
*
* @additionalExamples
* ### Basic Usage
*
* ```tsx
* import { useParams } from "react-router";
*
* // given a route like:
* <Route path="/posts/:postId" element={<Post />} />;
*
* // or a data route like:
* createBrowserRouter([
*   {
*     path: "/posts/:postId",
*     component: Post,
*   },
* ]);
*
* // or in routes.ts
* route("/posts/:postId", "routes/post.tsx");
* ```
*
* Access the params in a component:
*
* ```tsx
* import { useParams } from "react-router";
*
* export default function Post() {
*   let params = useParams();
*   return <h1>Post: {params.postId}</h1>;
* }
* ```
*
* ### Multiple Params
*
* Patterns can have multiple params:
*
* ```tsx
* "/posts/:postId/comments/:commentId";
* ```
*
* All will be available in the params object:
*
* ```tsx
* import { useParams } from "react-router";
*
* export default function Post() {
*   let params = useParams();
*   return (
*     <h1>
*       Post: {params.postId}, Comment: {params.commentId}
*     </h1>
*   );
* }
* ```
*
* ### Catchall Params
*
* Catchall params are defined with `*`:
*
* ```tsx
* "/files/*";
* ```
*
* The matched value will be available in the params object as follows:
*
* ```tsx
* import { useParams } from "react-router";
*
* export default function File() {
*   let params = useParams();
*   let catchall = params["*"];
*   // ...
* }
* ```
*
* You can destructure the catchall param:
*
* ```tsx
* export default function File() {
*   let { "*": catchall } = useParams();
*   console.log(catchall);
* }
* ```
*
* @public
* @category Hooks
* @returns An object containing the dynamic route parameters
*/
function useParams() {
	let { matches } = React$1.useContext(RouteContext);
	return matches[matches.length - 1]?.params ?? {};
}
/**
* Resolves the pathname of the given `to` value against the current
* {@link Location}. Similar to {@link useHref}, but returns a
* {@link Path} instead of a string.
*
* @example
* import { useResolvedPath } from "react-router";
*
* function SomeComponent() {
*   // if the user is at /dashboard/profile
*   let path = useResolvedPath("../accounts");
*   path.pathname; // "/dashboard/accounts"
*   path.search; // ""
*   path.hash; // ""
* }
*
* @public
* @category Hooks
* @param to The path to resolve
* @param options Options
* @param options.relative Defaults to `"route"` so routing is relative to the route tree.
*                         Set to `"path"` to make relative routing operate against path segments.
* @returns The resolved {@link Path} object with `pathname`, `search`, and `hash`
*/
function useResolvedPath(to, { relative } = {}) {
	let { matches } = React$1.useContext(RouteContext);
	let { pathname: locationPathname } = useLocation();
	let routePathnamesJson = JSON.stringify(getResolveToMatches(matches));
	return React$1.useMemo(() => resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, relative === "path"), [
		to,
		routePathnamesJson,
		locationPathname,
		relative
	]);
}
/**
* Hook version of {@link Routes | `<Routes>`} that uses objects instead of
* components. These objects have the same properties as the component props.
* The return value of `useRoutes` is either a valid React element you can use
* to render the route tree, or `null` if nothing matched.
*
* @example
* import { useRoutes } from "react-router";
*
* function App() {
*   let element = useRoutes([
*     {
*       path: "/",
*       element: <Dashboard />,
*       children: [
*         {
*           path: "messages",
*           element: <DashboardMessages />,
*         },
*         { path: "tasks", element: <DashboardTasks /> },
*       ],
*     },
*     { path: "team", element: <AboutPage /> },
*   ]);
*
*   return element;
* }
*
* @public
* @category Hooks
* @param routes An array of {@link RouteObject}s that define the route hierarchy
* @param locationArg An optional {@link Location} object or pathname string to
* use instead of the current {@link Location}
* @returns A React element to render the matched route, or `null` if no routes matched
*/
function useRoutes(routes, locationArg) {
	return useRoutesImpl(routes, locationArg);
}
function useRoutesImpl(routes, locationArg, dataRouterOpts) {
	invariant(useInRouterContext(), `useRoutes() may be used only in the context of a <Router> component.`);
	let { navigator } = React$1.useContext(NavigationContext);
	let { matches: parentMatches } = React$1.useContext(RouteContext);
	let routeMatch = parentMatches[parentMatches.length - 1];
	let parentParams = routeMatch ? routeMatch.params : {};
	let parentPathname = routeMatch ? routeMatch.pathname : "/";
	let parentPathnameBase = routeMatch ? routeMatch.pathnameBase : "/";
	let parentRoute = routeMatch && routeMatch.route;
	{
		let parentPath = parentRoute && parentRoute.path || "";
		warningOnce(parentPathname, !parentRoute || parentPath.endsWith("*") || parentPath.endsWith("*?"), `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${parentPathname}" (under <Route path="${parentPath}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.\n\nPlease change the parent <Route path="${parentPath}"> to <Route path="${parentPath === "/" ? "*" : `${parentPath}/*`}">.`);
	}
	let locationFromContext = useLocation();
	let location;
	if (locationArg) {
		let parsedLocationArg = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
		invariant(parentPathnameBase === "/" || parsedLocationArg.pathname?.startsWith(parentPathnameBase), `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${parentPathnameBase}" but pathname "${parsedLocationArg.pathname}" was given in the \`location\` prop.`);
		location = parsedLocationArg;
	} else location = locationFromContext;
	let pathname = location.pathname || "/";
	let remainingPathname = pathname;
	if (parentPathnameBase !== "/") {
		let parentSegments = parentPathnameBase.replace(/^\//, "").split("/");
		remainingPathname = "/" + pathname.replace(/^\//, "").split("/").slice(parentSegments.length).join("/");
	}
	let matches = dataRouterOpts && dataRouterOpts.state.matches.length ? dataRouterOpts.state.matches.map((m) => Object.assign(m, { route: dataRouterOpts.manifest[m.route.id] || m.route })) : matchRoutes(routes, { pathname: remainingPathname });
	warning(parentRoute || matches != null, `No routes matched location "${location.pathname}${location.search}${location.hash}" `);
	warning(matches == null || matches[matches.length - 1].route.element !== void 0 || matches[matches.length - 1].route.Component !== void 0 || matches[matches.length - 1].route.lazy !== void 0, `Matched leaf route at location "${location.pathname}${location.search}${location.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`);
	let renderedMatches = _renderMatches(matches && matches.map((match) => Object.assign({}, match, {
		params: Object.assign({}, parentParams, match.params),
		pathname: joinPaths([parentPathnameBase, navigator.encodeLocation ? navigator.encodeLocation(match.pathname.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")).pathname : match.pathname]),
		pathnameBase: match.pathnameBase === "/" ? parentPathnameBase : joinPaths([parentPathnameBase, navigator.encodeLocation ? navigator.encodeLocation(match.pathnameBase.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")).pathname : match.pathnameBase])
	})), parentMatches, dataRouterOpts);
	if (locationArg && renderedMatches) return /* @__PURE__ */ React$1.createElement(LocationContext.Provider, { value: {
		location: {
			pathname: "/",
			search: "",
			hash: "",
			state: null,
			key: "default",
			mask: void 0,
			...location
		},
		navigationType: "POP"
	} }, renderedMatches);
	return renderedMatches;
}
function DefaultErrorComponent() {
	let error = useRouteError();
	let message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : JSON.stringify(error);
	let stack = error instanceof Error ? error.stack : null;
	let lightgrey = "rgba(200,200,200, 0.5)";
	let preStyles = {
		padding: "0.5rem",
		backgroundColor: lightgrey
	};
	let codeStyles = {
		padding: "2px 4px",
		backgroundColor: lightgrey
	};
	let devInfo = null;
	console.error("Error handled by React Router default ErrorBoundary:", error);
	devInfo = /* @__PURE__ */ React$1.createElement(React$1.Fragment, null, /* @__PURE__ */ React$1.createElement("p", null, "💿 Hey developer 👋"), /* @__PURE__ */ React$1.createElement("p", null, "You can provide a way better UX than this when your app throws errors by providing your own ", /* @__PURE__ */ React$1.createElement("code", { style: codeStyles }, "ErrorBoundary"), " or", " ", /* @__PURE__ */ React$1.createElement("code", { style: codeStyles }, "errorElement"), " prop on your route."));
	return /* @__PURE__ */ React$1.createElement(React$1.Fragment, null, /* @__PURE__ */ React$1.createElement("h2", null, "Unexpected Application Error!"), /* @__PURE__ */ React$1.createElement("h3", { style: { fontStyle: "italic" } }, message), stack ? /* @__PURE__ */ React$1.createElement("pre", { style: preStyles }, stack) : null, devInfo);
}
const defaultErrorElement = /* @__PURE__ */ React$1.createElement(DefaultErrorComponent, null);
var RenderErrorBoundary = class extends React$1.Component {
	constructor(props) {
		super(props);
		this.state = {
			location: props.location,
			revalidation: props.revalidation,
			error: props.error
		};
	}
	static contextType = RSCRouterContext;
	static getDerivedStateFromError(error) {
		return { error };
	}
	static getDerivedStateFromProps(props, state) {
		if (state.location !== props.location || state.revalidation !== "idle" && props.revalidation === "idle") return {
			error: props.error,
			location: props.location,
			revalidation: props.revalidation
		};
		return {
			error: props.error !== void 0 ? props.error : state.error,
			location: state.location,
			revalidation: props.revalidation || state.revalidation
		};
	}
	componentDidCatch(error, errorInfo) {
		if (this.props.onError) this.props.onError(error, errorInfo);
		else console.error("React Router caught the following error during render", error);
	}
	render() {
		let error = this.state.error;
		if (this.context && typeof error === "object" && error && "digest" in error && typeof error.digest === "string") {
			const decoded = decodeRouteErrorResponseDigest(error.digest);
			if (decoded) error = decoded;
		}
		let result = error !== void 0 ? /* @__PURE__ */ React$1.createElement(RouteContext.Provider, { value: this.props.routeContext }, /* @__PURE__ */ React$1.createElement(RouteErrorContext.Provider, {
			value: error,
			children: this.props.component
		})) : this.props.children;
		if (this.context) return /* @__PURE__ */ React$1.createElement(RSCErrorHandler, { error }, result);
		return result;
	}
};
const errorRedirectHandledMap = /* @__PURE__ */ new WeakMap();
function RSCErrorHandler({ children, error }) {
	let { basename } = React$1.useContext(NavigationContext);
	if (typeof error === "object" && error && "digest" in error && typeof error.digest === "string") {
		let redirect = decodeRedirectErrorDigest(error.digest);
		if (redirect) {
			let existingRedirect = errorRedirectHandledMap.get(error);
			if (existingRedirect) throw existingRedirect;
			let parsed = parseToInfo(redirect.location, basename);
			let target = parsed.absoluteURL || parsed.to;
			if (hasInvalidProtocol(target)) throw new Error("Invalid redirect location");
			if (isBrowser && !errorRedirectHandledMap.get(error)) if (parsed.isExternal || redirect.reloadDocument) window.location.href = target;
			else {
				const redirectPromise = Promise.resolve().then(() => window.__reactRouterDataRouter.navigate(parsed.to, { replace: redirect.replace }));
				errorRedirectHandledMap.set(error, redirectPromise);
				throw redirectPromise;
			}
			return /* @__PURE__ */ React$1.createElement("meta", {
				httpEquiv: "refresh",
				content: `0;url=${target}`
			});
		}
	}
	return children;
}
function RenderedRoute({ routeContext, match, children }) {
	let dataRouterContext = React$1.useContext(DataRouterContext);
	if (dataRouterContext && dataRouterContext.static && dataRouterContext.staticContext && (match.route.errorElement || match.route.ErrorBoundary)) dataRouterContext.staticContext._deepestRenderedBoundaryId = match.route.id;
	return /* @__PURE__ */ React$1.createElement(RouteContext.Provider, { value: routeContext }, children);
}
function _renderMatches(matches, parentMatches = [], dataRouterOpts) {
	let dataRouterState = dataRouterOpts?.state;
	if (matches == null) {
		if (!dataRouterState) return null;
		if (dataRouterState.errors) matches = dataRouterState.matches;
		else if (parentMatches.length === 0 && !dataRouterState.initialized && dataRouterState.matches.length > 0) matches = dataRouterState.matches;
		else return null;
	}
	let renderedMatches = matches;
	let errors = dataRouterState?.errors;
	if (errors != null) {
		let errorIndex = renderedMatches.findIndex((m) => m.route.id && errors?.[m.route.id] !== void 0);
		invariant(errorIndex >= 0, `Could not find a matching route for errors on route IDs: ${Object.keys(errors).join(",")}`);
		renderedMatches = renderedMatches.slice(0, Math.min(renderedMatches.length, errorIndex + 1));
	}
	let renderFallback = false;
	let fallbackIndex = -1;
	if (dataRouterOpts && dataRouterState) {
		renderFallback = dataRouterState.renderFallback;
		for (let i = 0; i < renderedMatches.length; i++) {
			let match = renderedMatches[i];
			if (match.route.HydrateFallback || match.route.hydrateFallbackElement) fallbackIndex = i;
			if (match.route.id) {
				let { loaderData, errors } = dataRouterState;
				let needsToRunLoader = match.route.loader && !loaderData.hasOwnProperty(match.route.id) && (!errors || errors[match.route.id] === void 0);
				if (match.route.lazy || needsToRunLoader) {
					if (dataRouterOpts.isStatic) renderFallback = true;
					if (fallbackIndex >= 0) renderedMatches = renderedMatches.slice(0, fallbackIndex + 1);
					else renderedMatches = [renderedMatches[0]];
					break;
				}
			}
		}
	}
	let onErrorHandler = dataRouterOpts?.onError;
	let onError = dataRouterState && onErrorHandler ? (error, errorInfo) => {
		onErrorHandler(error, {
			location: dataRouterState.location,
			params: dataRouterState.matches?.[0]?.params ?? {},
			pattern: getRoutePattern(dataRouterState.matches),
			errorInfo
		});
	} : void 0;
	return renderedMatches.reduceRight((outlet, match, index) => {
		let error;
		let shouldRenderHydrateFallback = false;
		let errorElement = null;
		let hydrateFallbackElement = null;
		if (dataRouterState) {
			error = errors && match.route.id ? errors[match.route.id] : void 0;
			errorElement = match.route.errorElement || defaultErrorElement;
			if (renderFallback) {
				if (fallbackIndex < 0 && index === 0) {
					warningOnce("route-fallback", false, "No `HydrateFallback` element provided to render during initial hydration");
					shouldRenderHydrateFallback = true;
					hydrateFallbackElement = null;
				} else if (fallbackIndex === index) {
					shouldRenderHydrateFallback = true;
					hydrateFallbackElement = match.route.hydrateFallbackElement || null;
				}
			}
		}
		let matches = parentMatches.concat(renderedMatches.slice(0, index + 1));
		let getChildren = () => {
			let children;
			if (error) children = errorElement;
			else if (shouldRenderHydrateFallback) children = hydrateFallbackElement;
			else if (match.route.Component) children = /* @__PURE__ */ React$1.createElement(match.route.Component, null);
			else if (match.route.element) children = match.route.element;
			else children = outlet;
			return /* @__PURE__ */ React$1.createElement(RenderedRoute, {
				match,
				routeContext: {
					outlet,
					matches,
					isDataRoute: dataRouterState != null
				},
				children
			});
		};
		return dataRouterState && (match.route.ErrorBoundary || match.route.errorElement || index === 0) ? /* @__PURE__ */ React$1.createElement(RenderErrorBoundary, {
			location: dataRouterState.location,
			revalidation: dataRouterState.revalidation,
			component: errorElement,
			error,
			children: getChildren(),
			routeContext: {
				outlet: null,
				matches,
				isDataRoute: true
			},
			onError
		}) : getChildren();
	}, null);
}
function getDataRouterConsoleError(hookName) {
	return `${hookName} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function useDataRouterContext(hookName) {
	let ctx = React$1.useContext(DataRouterContext);
	invariant(ctx, getDataRouterConsoleError(hookName));
	return ctx;
}
function useDataRouterState(hookName) {
	let state = React$1.useContext(DataRouterStateContext);
	invariant(state, getDataRouterConsoleError(hookName));
	return state;
}
function useRouteContext(hookName) {
	let route = React$1.useContext(RouteContext);
	invariant(route, getDataRouterConsoleError(hookName));
	return route;
}
function useCurrentRouteId(hookName) {
	let route = useRouteContext(hookName);
	let thisRoute = route.matches[route.matches.length - 1];
	invariant(thisRoute.route.id, `${hookName} can only be used on routes that contain a unique "id"`);
	return thisRoute.route.id;
}
/**
* Returns the ID for the nearest contextual route
*
* @category Hooks
* @returns The ID of the nearest contextual route
*/
function useRouteId() {
	return useCurrentRouteId("useRouteId");
}
/**
* Returns the current {@link Navigation}, defaulting to an "idle" navigation
* when no navigation is in progress. You can use this to render pending UI
* (like a global spinner) or read [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
* from a form navigation.
*
* @example
* import { useNavigation } from "react-router";
*
* function SomeComponent() {
*   let navigation = useNavigation();
*   navigation.state;
*   navigation.formData;
*   // etc.
* }
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @returns The current {@link Navigation} object
*/
function useNavigation() {
	let state = useDataRouterState("useNavigation");
	return React$1.useMemo(() => {
		let { matches, historyAction, ...rest } = state.navigation;
		return rest;
	}, [state.navigation]);
}
/**
* Revalidate the data on the page for reasons outside of normal data mutations
* like [`Window` focus](https://developer.mozilla.org/en-US/docs/Web/API/Window/focus_event)
* or polling on an interval.
*
* Note that page data is already revalidated automatically after actions.
* If you find yourself using this for normal CRUD operations on your data in
* response to user interactions, you're probably not taking advantage of the
* other APIs like {@link useFetcher}, {@link Form}, {@link useSubmit} that do
* this automatically.
*
* @example
* import { useRevalidator } from "react-router";
*
* function WindowFocusRevalidator() {
*   const revalidator = useRevalidator();
*
*   useFakeWindowFocus(() => {
*     revalidator.revalidate();
*   });
*
*   return (
*     <div hidden={revalidator.state === "idle"}>
*       Revalidating...
*     </div>
*   );
* }
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @returns An object with a `revalidate` function and the current revalidation
* `state`
*/
function useRevalidator() {
	let dataRouterContext = useDataRouterContext("useRevalidator");
	let state = useDataRouterState("useRevalidator");
	let revalidate = React$1.useCallback(async () => {
		await dataRouterContext.router.revalidate();
	}, [dataRouterContext.router]);
	return React$1.useMemo(() => ({
		revalidate,
		state: state.revalidation
	}), [revalidate, state.revalidation]);
}
/**
* Returns the active route matches, useful for accessing `loaderData` for
* parent/child routes or the route [`handle`](../../start/framework/route-module#handle)
* property
*
* Pairing the route `handle` with `useMatches` gets very powerful since you can put
* whatever you want on a route handle and have access to `useMatches` anywhere.
* Please see the [handle](../../how-to/using-handle) documentation for an example
* of breadcrumbs via `useMatches`/`handle`.
*
* ```tsx
* import { useMatches } from "react-router";
*
* function SomeComponent() {
*   const matches = useMatches();
*   // matches[i].id          // route id
*   // matches[i].pathname    // the portion of the URL the route matched
*   // matches[i].params      // the parsed params from the URL
*   // matches[i].loaderData  // the data from the loader
*   // matches[i].handle      // the route handle with any app specific data
* }
* ```
*
* <docs-info>useMatches only works with a data router like `createBrowserRouter`,
* since they know the full route tree up front and can provide all of the current
* matches. Additionally, `useMatches` will not match down into any descendant route
* trees since the router isn't aware of the descendant routes.</docs-info>
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @returns An array of {@link UIMatch | UI matches} for the current route hierarchy
*/
function useMatches() {
	let { matches, loaderData } = useDataRouterState("useMatches");
	return React$1.useMemo(() => matches.map((m) => convertRouteMatchToUiMatch(m, loaderData)), [matches, loaderData]);
}
/**
* Returns the data from the closest route
* [`loader`](../../start/framework/route-module#loader) or
* [`clientLoader`](../../start/framework/route-module#clientloader).
*
* @example
* import { useLoaderData } from "react-router";
*
* export async function loader() {
*   return await fakeDb.invoices.findAll();
* }
*
* export default function Invoices() {
*   let invoices = useLoaderData<typeof loader>();
*   // ...
* }
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @returns The data returned from the route's [`loader`](../../start/framework/route-module#loader) or [`clientLoader`](../../start/framework/route-module#clientloader) function
*/
function useLoaderData() {
	let state = useDataRouterState("useLoaderData");
	let routeId = useCurrentRouteId("useLoaderData");
	return state.loaderData[routeId];
}
/**
* Returns the [`loader`](../../start/framework/route-module#loader) data for a
* given route by route ID.
*
* Route IDs are created automatically. They are simply the path of the route file
* relative to the app folder without the extension.
*
* | Route Filename               | Route ID               |
* | ---------------------------- | ---------------------- |
* | `app/root.tsx`               | `"root"`               |
* | `app/routes/teams.tsx`       | `"routes/teams"`       |
* | `app/whatever/teams.$id.tsx` | `"whatever/teams.$id"` |
*
* @example
* import { useRouteLoaderData } from "react-router";
*
* function SomeComponent() {
*   const { user } = useRouteLoaderData("root");
* }
*
* // You can also specify your own route ID's manually in your routes.ts file:
* route("/", "containers/app.tsx", { id: "app" })
* useRouteLoaderData("app");
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @param routeId The ID of the route to return loader data from
* @returns The data returned from the specified route's [`loader`](../../start/framework/route-module#loader)
* function, or `undefined` if not found
*/
function useRouteLoaderData(routeId) {
	return useDataRouterState("useRouteLoaderData").loaderData[routeId];
}
/**
* Returns the [`action`](../../start/framework/route-module#action) data from
* the most recent `POST` navigation form submission or `undefined` if there
* hasn't been one.
*
* @example
* import { Form, useActionData } from "react-router";
*
* export async function action({ request }) {
*   const body = await request.formData();
*   const name = body.get("visitorsName");
*   return { message: `Hello, ${name}` };
* }
*
* export default function Invoices() {
*   const data = useActionData();
*   return (
*     <Form method="post">
*       <input type="text" name="visitorsName" />
*       {data ? data.message : "Waiting..."}
*     </Form>
*   );
* }
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @returns The data returned from the route's [`action`](../../start/framework/route-module#action)
* function, or `undefined` if no [`action`](../../start/framework/route-module#action)
* has been called
*/
function useActionData() {
	let state = useDataRouterState("useActionData");
	let routeId = useCurrentRouteId("useLoaderData");
	return state.actionData ? state.actionData[routeId] : void 0;
}
/**
* Accesses the error thrown during an
* [`action`](../../start/framework/route-module#action),
* [`loader`](../../start/framework/route-module#loader),
* or component render to be used in a route module
* [`ErrorBoundary`](../../start/framework/route-module#errorboundary).
*
* @example
* export function ErrorBoundary() {
*   const error = useRouteError();
*   return <div>{error.message}</div>;
* }
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @returns The error that was thrown during route [loading](../../start/framework/route-module#loader),
* [`action`](../../start/framework/route-module#action) execution, or rendering
*/
function useRouteError() {
	let error = React$1.useContext(RouteErrorContext);
	let state = useDataRouterState("useRouteError");
	let routeId = useCurrentRouteId("useRouteError");
	if (error !== void 0) return error;
	return state.errors?.[routeId];
}
/**
* Returns the resolved promise value from the closest {@link Await | `<Await>`}.
*
* @example
* function SomeDescendant() {
*   const value = useAsyncValue();
*   // ...
* }
*
* // somewhere in your app
* <Await resolve={somePromise}>
*   <SomeDescendant />
* </Await>;
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @returns The resolved value from the nearest {@link Await} component
*/
function useAsyncValue() {
	return React$1.useContext(AwaitContext)?._data;
}
/**
* Returns the rejection value from the closest {@link Await | `<Await>`}.
*
* @example
* import { Await, useAsyncError } from "react-router";
*
* function ErrorElement() {
*   const error = useAsyncError();
*   return (
*     <p>Uh Oh, something went wrong! {error.message}</p>
*   );
* }
*
* // somewhere in your app
* <Await
*   resolve={promiseThatRejects}
*   errorElement={<ErrorElement />}
* />;
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @returns The error that was thrown in the nearest {@link Await} component
*/
function useAsyncError() {
	return React$1.useContext(AwaitContext)?._error;
}
let blockerId = 0;
/**
* Allow the application to block navigations within the SPA and present the
* user a confirmation dialog to confirm the navigation. Mostly used to avoid
* using half-filled form data. This does not handle hard-reloads or
* cross-origin navigations.
*
* The {@link Blocker} object returned by the hook has the following properties:
*
* - **`state`**
*   - `unblocked` - the blocker is idle and has not prevented any navigation
*   - `blocked` - the blocker has prevented a navigation
*   - `proceeding` - the blocker is proceeding through from a blocked navigation
* - **`location`**
*   - When in a `blocked` state, this represents the {@link Location} to which
*     we blocked a navigation. When in a `proceeding` state, this is the
*     location being navigated to after a `blocker.proceed()` call.
* - **`proceed()`**
*   - When in a `blocked` state, you may call `blocker.proceed()` to proceed to
*     the blocked location.
* - **`reset()`**
*   - When in a `blocked` state, you may call `blocker.reset()` to return the
*     blocker to an `unblocked` state and leave the user at the current
*     location.
*
* @example
* // Boolean version
* let blocker = useBlocker(value !== "");
*
* // Function version
* let blocker = useBlocker(
*   ({ currentLocation, nextLocation, historyAction }) =>
*     value !== "" &&
*     currentLocation.pathname !== nextLocation.pathname
* );
*
* @additionalExamples
* ```tsx
* import { useCallback, useState } from "react";
* import { BlockerFunction, useBlocker } from "react-router";
*
* export function ImportantForm() {
*   const [value, setValue] = useState("");
*
*   const shouldBlock = useCallback<BlockerFunction>(
*     () => value !== "",
*     [value]
*   );
*   const blocker = useBlocker(shouldBlock);
*
*   return (
*     <form
*       onSubmit={(e) => {
*         e.preventDefault();
*         setValue("");
*         if (blocker.state === "blocked") {
*           blocker.proceed();
*         }
*       }}
*     >
*       <input
*         name="data"
*         value={value}
*         onChange={(e) => setValue(e.target.value)}
*       />
*
*       <button type="submit">Save</button>
*
*       {blocker.state === "blocked" ? (
*         <>
*           <p style={{ color: "red" }}>
*             Blocked the last navigation to
*           </p>
*           <button
*             type="button"
*             onClick={() => blocker.proceed()}
*           >
*             Let me through
*           </button>
*           <button
*             type="button"
*             onClick={() => blocker.reset()}
*           >
*             Keep me here
*           </button>
*         </>
*       ) : blocker.state === "proceeding" ? (
*         <p style={{ color: "orange" }}>
*           Proceeding through blocked navigation
*         </p>
*       ) : (
*         <p style={{ color: "green" }}>
*           Blocker is currently unblocked
*         </p>
*       )}
*     </form>
*   );
* }
* ```
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @param shouldBlock Either a boolean or a function returning a boolean which
* indicates whether the navigation should be blocked. The function format
* receives a single object parameter containing the `currentLocation`,
* `nextLocation`, and `historyAction` of the potential navigation.
* @returns A {@link Blocker} object with state and reset functionality
*/
function useBlocker(shouldBlock) {
	let { router, basename } = useDataRouterContext("useBlocker");
	let state = useDataRouterState("useBlocker");
	let [blockerKey, setBlockerKey] = React$1.useState("");
	let blockerFunction = React$1.useCallback((arg) => {
		if (typeof shouldBlock !== "function") return !!shouldBlock;
		if (basename === "/") return shouldBlock(arg);
		let { currentLocation, nextLocation, historyAction } = arg;
		return shouldBlock({
			currentLocation: {
				...currentLocation,
				pathname: stripBasename(currentLocation.pathname, basename) || currentLocation.pathname
			},
			nextLocation: {
				...nextLocation,
				pathname: stripBasename(nextLocation.pathname, basename) || nextLocation.pathname
			},
			historyAction
		});
	}, [basename, shouldBlock]);
	React$1.useEffect(() => {
		let key = String(++blockerId);
		setBlockerKey(key);
		return () => router.deleteBlocker(key);
	}, [router]);
	React$1.useEffect(() => {
		if (blockerKey !== "") router.getBlocker(blockerKey, blockerFunction);
	}, [
		router,
		blockerKey,
		blockerFunction
	]);
	return blockerKey && state.blockers.has(blockerKey) ? state.blockers.get(blockerKey) : IDLE_BLOCKER;
}
function useNavigateStable() {
	let { router } = useDataRouterContext("useNavigate");
	let id = useCurrentRouteId("useNavigate");
	let activeRef = React$1.useRef(false);
	React$1.useLayoutEffect(() => {
		activeRef.current = true;
	});
	return React$1.useCallback(async (to, options = {}) => {
		warning(activeRef.current, navigateEffectWarning);
		if (!activeRef.current) return;
		if (typeof to === "number") await router.navigate(to);
		else await router.navigate(to, {
			fromRouteId: id,
			...options
		});
	}, [router, id]);
}
const alreadyWarned = {};
function warningOnce(key, cond, message) {
	if (!cond && !alreadyWarned[key]) {
		alreadyWarned[key] = true;
		warning(false, message);
	}
}
function useRoute(...args) {
	const currentRouteId = useCurrentRouteId("useRoute");
	const id = args[0] ?? currentRouteId;
	const state = useDataRouterState("useRoute");
	const route = state.matches.find(({ route }) => route.id === id);
	if (route === void 0) return void 0;
	return {
		handle: route.route.handle,
		loaderData: state.loaderData[id],
		actionData: state.actionData?.[id]
	};
}
function toRouterStateMatch(match) {
	return {
		id: match.route.id,
		pathname: match.pathname,
		params: match.params,
		handle: match.route.handle
	};
}
/**
* A unified hook for reading router state: current (`active`) and in-flight
* (`pending`) locations, search params, params, matches, and navigation type.
*
* This hook consolidates the information you used to get from {@link useLocation},
* {@link useSearchParams}, {@link useParams}, {@link useMatches}, {@link useNavigation},
* and {@link useNavigationType} into a single hook.
*
*
* @example
* import { unstable_useRouterState as useRouterState } from "react-router";
*
* let { active, pending } = unstable_useRouterState();
*
* // Active is always populated with the current location
* active.location; // replaces `useLocation()`
* active.searchParams; // replaces `useSearchParams()[0]`
* active.params; // replaces `useParams()`
* active.matches; // replaces `useMatches()`
* active.type; // replaces `useNavigationType()`
*
* // Pending is only populated during a navigation
* pending.location; // replaces `useNavigation().location`
* pending.searchParams; // equivalent to `new URLSearchParams(useNavigation().search)`
* pending.params; // Not directly accessible today
* pending.matches; // Not directly accessible today
* pending.type; // Not directly accessible today
* pending.state; // replaces `useNavigation().state`
* pending.formMethod; // replaces useNavigation().formMethod
* pending.formAction; // replaces useNavigation().formAction
* pending.formEncType; // replaces useNavigation().formEncType
* pending.formData; // replaces useNavigation().formData
* pending.json; // replaces useNavigation().json
* pending.text; // replaces useNavigation().text
*
* @name unstable_useRouterState
* @public
* @category Hooks
* @mode framework
* @mode data
* @returns The current router state with `active` and `pending` variants
*/
function useRouterState() {
	let { location, historyAction: type, matches, navigation } = useDataRouterState("unstable_useRouterState");
	let active = React$1.useMemo(() => ({
		type,
		location,
		searchParams: new URLSearchParams(location.search),
		params: matches[matches.length - 1]?.params ?? {},
		matches: matches.map((m) => toRouterStateMatch(m))
	}), [
		location,
		matches,
		type
	]);
	let pending = React$1.useMemo(() => {
		if (navigation.state === "idle") return null;
		let shared = {
			type: navigation.historyAction,
			location: navigation.location,
			searchParams: new URLSearchParams(navigation.location.search),
			params: navigation.matches[navigation.matches.length - 1]?.params ?? {},
			matches: navigation.matches.map((m) => toRouterStateMatch(m))
		};
		return navigation.state === "loading" ? {
			...shared,
			state: "loading",
			formMethod: navigation.formMethod,
			formAction: navigation.formAction,
			formEncType: navigation.formEncType,
			formData: navigation.formData,
			json: navigation.json,
			text: navigation.text
		} : {
			...shared,
			state: "submitting",
			formMethod: navigation.formMethod,
			formAction: navigation.formAction,
			formEncType: navigation.formEncType,
			formData: navigation.formData,
			json: navigation.json,
			text: navigation.text
		};
	}, [navigation]);
	return React$1.useMemo(() => ({
		active,
		pending
	}), [active, pending]);
}
//#endregion
export { _renderMatches, useActionData, useAsyncError, useAsyncValue, useBlocker, useHref, useInRouterContext, useLoaderData, useLocation, useMatch, useMatches, useNavigate, useNavigation, useNavigationType, useOutlet, useOutletContext, useParams, useResolvedPath, useRevalidator, useRoute, useRouteError, useRouteId, useRouteLoaderData, useRouterState, useRoutes, useRoutesImpl };
