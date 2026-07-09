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
import { ABSOLUTE_URL_REGEX } from "../router/url.js";
import { createBrowserHistory, createHashHistory, createPath, invariant, warning } from "../router/history.js";
import { ErrorResponseImpl, SUPPORTED_ERROR_TYPES, defaultMapRouteProperties, joinPaths, matchPath, parseToInfo, resolveTo, stripBasename } from "../router/utils.js";
import { IDLE_FETCHER, createRouter } from "../router/router.js";
import { DataRouterContext, DataRouterStateContext, FetchersContext, NavigationContext, RouteContext, ViewTransitionContext } from "../context.js";
import { useBlocker, useHref, useLocation, useMatches, useNavigate, useNavigation, useResolvedPath, useRouteId } from "../hooks.js";
import { Router, hydrationRouteProperties } from "../components.js";
import { createSearchParams, getFormSubmissionInfo, getSearchParamsForLocation, shouldProcessLinkClick } from "./dom.js";
import { escapeHtml } from "./ssr/markup.js";
import { FrameworkContext, PrefetchPageLinks, mergeRefs, usePrefetchBehavior } from "./ssr/components.js";
import * as React$1 from "react";
//#region lib/dom/lib.tsx
const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined";
try {
	if (isBrowser) window.__reactRouterVersion = "8.2.0";
} catch (e) {}
/**
* Create a new {@link DataRouter| data router} that manages the application
* path via [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)
* and [`history.replaceState`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState).
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
* @param {DOMRouterOpts.basename} opts.basename n/a
* @param {DOMRouterOpts.dataStrategy} opts.dataStrategy n/a
* @param {DOMRouterOpts.future} opts.future n/a
* @param {DOMRouterOpts.getContext} opts.getContext n/a
* @param {DOMRouterOpts.hydrationData} opts.hydrationData n/a
* @param {DOMRouterOpts.instrumentations} opts.instrumentations n/a
* @param {DOMRouterOpts.patchRoutesOnNavigation} opts.patchRoutesOnNavigation n/a
* @param {DOMRouterOpts.window} opts.window n/a
* @returns An initialized {@link DataRouter| data router} to pass to {@link RouterProvider | `<RouterProvider>`}
*/
function createBrowserRouter(routes, opts) {
	return createRouter({
		basename: opts?.basename,
		getContext: opts?.getContext,
		future: opts?.future,
		history: createBrowserHistory({ window: opts?.window }),
		hydrationData: opts?.hydrationData || parseHydrationData(),
		routes,
		mapRouteProperties: defaultMapRouteProperties,
		hydrationRouteProperties,
		dataStrategy: opts?.dataStrategy,
		patchRoutesOnNavigation: opts?.patchRoutesOnNavigation,
		window: opts?.window,
		instrumentations: opts?.instrumentations
	}).initialize();
}
/**
* Create a new {@link DataRouter| data router} that manages the application
* path via the URL [`hash`](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash).
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
* @param {DOMRouterOpts.basename} opts.basename n/a
* @param {DOMRouterOpts.future} opts.future n/a
* @param {DOMRouterOpts.getContext} opts.getContext n/a
* @param {DOMRouterOpts.hydrationData} opts.hydrationData n/a
* @param {DOMRouterOpts.instrumentations} opts.instrumentations n/a
* @param {DOMRouterOpts.dataStrategy} opts.dataStrategy n/a
* @param {DOMRouterOpts.patchRoutesOnNavigation} opts.patchRoutesOnNavigation n/a
* @param {DOMRouterOpts.window} opts.window n/a
* @returns An initialized {@link DataRouter| data router} to pass to {@link RouterProvider | `<RouterProvider>`}
*/
function createHashRouter(routes, opts) {
	return createRouter({
		basename: opts?.basename,
		getContext: opts?.getContext,
		future: opts?.future,
		history: createHashHistory({ window: opts?.window }),
		hydrationData: opts?.hydrationData || parseHydrationData(),
		routes,
		mapRouteProperties: defaultMapRouteProperties,
		hydrationRouteProperties,
		dataStrategy: opts?.dataStrategy,
		patchRoutesOnNavigation: opts?.patchRoutesOnNavigation,
		window: opts?.window,
		instrumentations: opts?.instrumentations
	}).initialize();
}
function parseHydrationData() {
	let state = window?.__staticRouterHydrationData;
	if (state && state.errors) state = {
		...state,
		errors: deserializeErrors(state.errors)
	};
	return state;
}
function deserializeErrors(errors) {
	if (!errors) return null;
	let entries = Object.entries(errors);
	let serialized = {};
	for (let [key, val] of entries) if (val && val.__type === "RouteErrorResponse") serialized[key] = new ErrorResponseImpl(val.status, val.statusText, val.data, val.internal === true);
	else if (val && val.__type === "Error") {
		if (typeof val.__subType === "string" && SUPPORTED_ERROR_TYPES.includes(val.__subType)) {
			let ErrorConstructor = window[val.__subType];
			if (typeof ErrorConstructor === "function") try {
				let error = new ErrorConstructor(val.message);
				error.stack = "";
				serialized[key] = error;
			} catch (e) {}
		}
		if (serialized[key] == null) {
			let error = new Error(val.message);
			error.stack = "";
			serialized[key] = error;
		}
	} else serialized[key] = val;
	return serialized;
}
/**
* A declarative {@link Router | `<Router>`} using the browser [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
* API for client-side routing.
*
* @public
* @category Declarative Routers
* @mode declarative
* @param props Props
* @param {BrowserRouterProps.basename} props.basename n/a
* @param {BrowserRouterProps.children} props.children n/a
* @param {BrowserRouterProps.useTransitions} props.useTransitions n/a
* @param {BrowserRouterProps.window} props.window n/a
* @returns A declarative {@link Router | `<Router>`} using the browser [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
* API for client-side routing.
*/
function BrowserRouter({ basename, children, useTransitions, window }) {
	let historyRef = React$1.useRef(null);
	if (historyRef.current == null) historyRef.current = createBrowserHistory({
		window,
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
* A declarative {@link Router | `<Router>`} that stores the location in the
* [`hash`](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash) portion
* of the URL so it is not sent to the server.
*
* @public
* @category Declarative Routers
* @mode declarative
* @param props Props
* @param {HashRouterProps.basename} props.basename n/a
* @param {HashRouterProps.children} props.children n/a
* @param {HashRouterProps.useTransitions} props.useTransitions n/a
* @param {HashRouterProps.window} props.window n/a
* @returns A declarative {@link Router | `<Router>`} using the URL [`hash`](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash)
* for client-side routing.
*/
function HashRouter({ basename, children, useTransitions, window }) {
	let historyRef = React$1.useRef(null);
	if (historyRef.current == null) historyRef.current = createHashHistory({
		window,
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
* A declarative {@link Router | `<Router>`} that accepts a pre-instantiated
* `history` object.
* It's important to note that using your own `history` object is highly discouraged
* and may add two versions of the `history` library to your bundles unless you use
* the same version of the `history` library that React Router uses internally.
*
* @name unstable_HistoryRouter
* @public
* @category Declarative Routers
* @mode declarative
* @param props Props
* @param {HistoryRouterProps.basename} props.basename n/a
* @param {HistoryRouterProps.children} props.children n/a
* @param {HistoryRouterProps.history} props.history n/a
* @param {HistoryRouterProps.useTransitions} props.useTransitions n/a
* @returns A declarative {@link Router | `<Router>`} using the provided history
* implementation for client-side routing.
*/
function HistoryRouter({ basename, children, history, useTransitions }) {
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
HistoryRouter.displayName = "unstable_HistoryRouter";
/**
* A progressively enhanced [`<a href>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a)
* wrapper to enable navigation with client-side routing.
*
* @example
* import { Link } from "react-router";
*
* <Link to="/dashboard">Dashboard</Link>;
*
* <Link
*   to={{
*     pathname: "/some/path",
*     search: "?query=string",
*     hash: "#hash",
*   }}
* />;
*
* @public
* @category Components
* @param {LinkProps.discover} props.discover [modes: framework] n/a
* @param {LinkProps.prefetch} props.prefetch [modes: framework] n/a
* @param {LinkProps.preventScrollReset} props.preventScrollReset [modes: framework, data] n/a
* @param {LinkProps.relative} props.relative n/a
* @param {LinkProps.reloadDocument} props.reloadDocument n/a
* @param {LinkProps.replace} props.replace n/a
* @param {LinkProps.state} props.state n/a
* @param {LinkProps.to} props.to n/a
* @param {LinkProps.viewTransition} props.viewTransition [modes: framework, data] n/a
* @param {LinkProps.defaultShouldRevalidate} props.defaultShouldRevalidate n/a
* @param {LinkProps.mask} props.mask [modes: framework, data] n/a
*/
const Link = React$1.forwardRef(function LinkWithRef({ onClick, discover = "render", prefetch = "none", relative, reloadDocument, replace, mask, state, target, to, preventScrollReset, viewTransition, defaultShouldRevalidate, ...rest }, forwardedRef) {
	let { basename, navigator, useTransitions } = React$1.useContext(NavigationContext);
	let isAbsolute = typeof to === "string" && ABSOLUTE_URL_REGEX.test(to);
	let parsed = parseToInfo(to, basename);
	to = parsed.to;
	let href = useHref(to, { relative });
	let location = useLocation();
	let maskedHref = null;
	if (mask) {
		let resolved = resolveTo(mask, [], location.mask ? location.mask.pathname : "/", true);
		if (basename !== "/") resolved.pathname = resolved.pathname === "/" ? basename : joinPaths([basename, resolved.pathname]);
		maskedHref = navigator.createHref(resolved);
	}
	let [shouldPrefetch, prefetchRef, prefetchHandlers] = usePrefetchBehavior(prefetch, rest);
	let internalOnClick = useLinkClickHandler(to, {
		replace,
		mask,
		state,
		target,
		preventScrollReset,
		relative,
		viewTransition,
		defaultShouldRevalidate,
		useTransitions
	});
	function handleClick(event) {
		if (onClick) onClick(event);
		if (!event.defaultPrevented) internalOnClick(event);
	}
	let isSpaLink = !(parsed.isExternal || reloadDocument);
	let link = /* @__PURE__ */ React$1.createElement("a", {
		...rest,
		...prefetchHandlers,
		href: (isSpaLink ? maskedHref : void 0) || parsed.absoluteURL || href,
		onClick: isSpaLink ? handleClick : onClick,
		ref: mergeRefs(forwardedRef, prefetchRef),
		target,
		"data-discover": !isAbsolute && discover === "render" ? "true" : void 0
	});
	return shouldPrefetch && !isAbsolute ? /* @__PURE__ */ React$1.createElement(React$1.Fragment, null, link, /* @__PURE__ */ React$1.createElement(PrefetchPageLinks, { page: href })) : link;
});
Link.displayName = "Link";
/**
* Wraps {@link Link | `<Link>`} with additional props for styling active and
* pending states.
*
* - Automatically applies classes to the link based on its `active` and `pending`
* states, see {@link NavLinkProps.className}
*   - Note that `pending` is only available with Framework and Data modes.
* - Automatically applies `aria-current="page"` to the link when the link is active.
* See [`aria-current`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current)
* on MDN.
* - States are additionally available through the className, style, and children
* render props. See {@link NavLinkRenderProps}.
*
* @example
* <NavLink to="/message">Messages</NavLink>
*
* // Using render props
* <NavLink
*   to="/messages"
*   className={({ isActive, isPending }) =>
*     isPending ? "pending" : isActive ? "active" : ""
*   }
* >
*   Messages
* </NavLink>
*
* @public
* @category Components
* @param {NavLinkProps.caseSensitive} props.caseSensitive n/a
* @param {NavLinkProps.children} props.children n/a
* @param {NavLinkProps.className} props.className n/a
* @param {NavLinkProps.discover} props.discover [modes: framework] n/a
* @param {NavLinkProps.end} props.end n/a
* @param {NavLinkProps.prefetch} props.prefetch [modes: framework] n/a
* @param {NavLinkProps.preventScrollReset} props.preventScrollReset [modes: framework, data] n/a
* @param {NavLinkProps.relative} props.relative n/a
* @param {NavLinkProps.reloadDocument} props.reloadDocument n/a
* @param {NavLinkProps.replace} props.replace n/a
* @param {NavLinkProps.state} props.state n/a
* @param {NavLinkProps.style} props.style n/a
* @param {NavLinkProps.to} props.to n/a
* @param {NavLinkProps.viewTransition} props.viewTransition [modes: framework, data] n/a
*/
const NavLink = React$1.forwardRef(function NavLinkWithRef({ "aria-current": ariaCurrentProp = "page", caseSensitive = false, className: classNameProp = "", end = false, style: styleProp, to, viewTransition, children, ...rest }, ref) {
	let path = useResolvedPath(to, { relative: rest.relative });
	let location = useLocation();
	let routerState = React$1.useContext(DataRouterStateContext);
	let { navigator, basename } = React$1.useContext(NavigationContext);
	let isTransitioning = routerState != null && useViewTransitionState(path) && viewTransition === true;
	let toPathname = navigator.encodeLocation ? navigator.encodeLocation(path).pathname : path.pathname;
	let locationPathname = location.pathname;
	let nextLocationPathname = routerState && routerState.navigation && routerState.navigation.location ? routerState.navigation.location.pathname : null;
	if (!caseSensitive) {
		locationPathname = locationPathname.toLowerCase();
		nextLocationPathname = nextLocationPathname ? nextLocationPathname.toLowerCase() : null;
		toPathname = toPathname.toLowerCase();
	}
	if (nextLocationPathname && basename) nextLocationPathname = stripBasename(nextLocationPathname, basename) || nextLocationPathname;
	const endSlashPosition = toPathname !== "/" && toPathname.endsWith("/") ? toPathname.length - 1 : toPathname.length;
	let isActive = locationPathname === toPathname || !end && locationPathname.startsWith(toPathname) && locationPathname.charAt(endSlashPosition) === "/";
	let isPending = nextLocationPathname != null && (nextLocationPathname === toPathname || !end && nextLocationPathname.startsWith(toPathname) && nextLocationPathname.charAt(toPathname.length) === "/");
	let renderProps = {
		isActive,
		isPending,
		isTransitioning
	};
	let ariaCurrent = isActive ? ariaCurrentProp : void 0;
	let className;
	if (typeof classNameProp === "function") className = classNameProp(renderProps);
	else className = [
		classNameProp,
		isActive ? "active" : null,
		isPending ? "pending" : null,
		isTransitioning ? "transitioning" : null
	].filter(Boolean).join(" ");
	let style = typeof styleProp === "function" ? styleProp(renderProps) : styleProp;
	return /* @__PURE__ */ React$1.createElement(Link, {
		...rest,
		"aria-current": ariaCurrent,
		className,
		ref,
		style,
		to,
		viewTransition
	}, typeof children === "function" ? children(renderProps) : children);
});
NavLink.displayName = "NavLink";
/**
* A progressively enhanced HTML [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form)
* that submits data to actions via [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch),
* activating pending states in {@link useNavigation} which enables advanced
* user interfaces beyond a basic HTML [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form).
* After a form's `action` completes, all data on the page is automatically
* revalidated to keep the UI in sync with the data.
*
* Because it uses the HTML form API, server rendered pages are interactive at a
* basic level before JavaScript loads. Instead of React Router managing the
* submission, the browser manages the submission as well as the pending states
* (like the spinning favicon). After JavaScript loads, React Router takes over
* enabling web application user experiences.
*
* `Form` is most useful for submissions that should also change the URL or
* otherwise add an entry to the browser history stack. For forms that shouldn't
* manipulate the browser [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
* stack, use {@link FetcherWithComponents.Form | `<fetcher.Form>`}.
*
* @example
* import { Form } from "react-router";
*
* function NewEvent() {
*   return (
*     <Form action="/events" method="post">
*       <input name="title" type="text" />
*       <input name="description" type="text" />
*     </Form>
*   );
* }
*
* @public
* @category Components
* @mode framework
* @mode data
* @param {FormProps.action} action n/a
* @param {FormProps.discover} discover n/a
* @param {FormProps.encType} encType n/a
* @param {FormProps.fetcherKey} fetcherKey n/a
* @param {FormProps.method} method n/a
* @param {FormProps.navigate} navigate n/a
* @param {FormProps.preventScrollReset} preventScrollReset n/a
* @param {FormProps.relative} relative n/a
* @param {FormProps.reloadDocument} reloadDocument n/a
* @param {FormProps.replace} replace n/a
* @param {FormProps.state} state n/a
* @param {FormProps.viewTransition} viewTransition n/a
* @param {FormProps.defaultShouldRevalidate} defaultShouldRevalidate n/a
* @returns A progressively enhanced [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) component
*/
const Form = React$1.forwardRef(({ discover = "render", fetcherKey, navigate, reloadDocument, replace, state, method = "get", action, onSubmit, relative, preventScrollReset, viewTransition, defaultShouldRevalidate, ...props }, forwardedRef) => {
	let { useTransitions } = React$1.useContext(NavigationContext);
	let submit = useSubmit();
	let formAction = useFormAction(action, { relative });
	let formMethod = method.toLowerCase() === "get" ? "get" : "post";
	let isAbsolute = typeof action === "string" && ABSOLUTE_URL_REGEX.test(action);
	let submitHandler = (event) => {
		onSubmit && onSubmit(event);
		if (event.defaultPrevented) return;
		event.preventDefault();
		let submitter = event.nativeEvent.submitter;
		let submitMethod = submitter?.getAttribute("formmethod") || method;
		let doSubmit = () => submit(submitter || event.currentTarget, {
			fetcherKey,
			method: submitMethod,
			navigate,
			replace,
			state,
			relative,
			preventScrollReset,
			viewTransition,
			defaultShouldRevalidate
		});
		if (useTransitions && navigate !== false) React$1.startTransition(() => doSubmit());
		else doSubmit();
	};
	return /* @__PURE__ */ React$1.createElement("form", {
		ref: forwardedRef,
		method: formMethod,
		action: formAction,
		onSubmit: reloadDocument ? onSubmit : submitHandler,
		...props,
		"data-discover": !isAbsolute && discover === "render" ? "true" : void 0
	});
});
Form.displayName = "Form";
/**
* Emulates the browser's scroll restoration on location changes. Apps should only render one of these, right before the {@link Scripts} component.
*
* ```tsx
* import { ScrollRestoration } from "react-router";
*
* export default function Root() {
*   return (
*     <html>
*       <body>
*         <ScrollRestoration />
*         <Scripts />
*       </body>
*     </html>
*   );
* }
* ```
*
* This component renders an inline `<script>` to prevent scroll flashing. The
* `nonce` prop will be passed down to the script tag to allow CSP nonce usage.
* If not provided in Framework Mode, it will default to any
* {@link ServerRouter | `<ServerRouter nonce>`} prop.
*
* ```tsx
* <ScrollRestoration nonce={cspNonce} />
* ```
*
* @public
* @category Components
* @mode framework
* @mode data
* @param props Props
* @param {ScrollRestorationProps.getKey} props.getKey n/a
* @param {ScriptsProps.nonce} props.nonce n/a
* @param {ScrollRestorationProps.storageKey} props.storageKey n/a
* @returns A [`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script)
* tag that restores scroll positions on navigation.
*/
function ScrollRestoration({ getKey, storageKey, ...props }) {
	let remixContext = React$1.useContext(FrameworkContext);
	let { basename } = React$1.useContext(NavigationContext);
	let location = useLocation();
	let matches = useMatches();
	useScrollRestoration({
		getKey,
		storageKey
	});
	let ssrKey = React$1.useMemo(() => {
		if (!remixContext || !getKey) return null;
		let userKey = getScrollRestorationKey(location, matches, basename, getKey);
		return userKey !== location.key ? userKey : null;
	}, []);
	if (!remixContext || remixContext.isSpaMode) return null;
	let restoreScroll = ((storageKey, restoreKey) => {
		if (!window.history.state || !window.history.state.key) {
			let key = Math.random().toString(32).slice(2);
			window.history.replaceState({ key }, "");
		}
		try {
			let storedY = JSON.parse(sessionStorage.getItem(storageKey) || "{}")[restoreKey || window.history.state.key];
			if (typeof storedY === "number") window.scrollTo(0, storedY);
		} catch (error) {
			console.error(error);
			sessionStorage.removeItem(storageKey);
		}
	}).toString();
	if (props.nonce == null && remixContext?.nonce) props.nonce = remixContext.nonce;
	return /* @__PURE__ */ React$1.createElement("script", {
		...props,
		suppressHydrationWarning: true,
		dangerouslySetInnerHTML: { __html: `(${restoreScroll})(${escapeHtml(JSON.stringify(storageKey || SCROLL_RESTORATION_STORAGE_KEY))}, ${escapeHtml(JSON.stringify(ssrKey))})` }
	});
}
ScrollRestoration.displayName = "ScrollRestoration";
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
/**
* Handles the click behavior for router {@link Link | `<Link>`} components.This
* is useful if you need to create custom {@link Link | `<Link>`} components with
* the same click behavior we use in our exported {@link Link | `<Link>`}.
*
* @public
* @category Hooks
* @param to The URL to navigate to, can be a string or a partial {@link Path}.
* @param options Options
* @param options.preventScrollReset Whether to prevent the scroll position from
* being reset to the top of the viewport on completion of the navigation when
* using the {@link ScrollRestoration} component. Defaults to `false`.
* @param options.relative The {@link RelativeRoutingType | relative routing type}
* to use for the link. Defaults to `"route"`.
* @param options.replace Whether to replace the current [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
* entry instead of pushing a new one. Defaults to `false`.
* @param options.state The state to add to the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
* entry for this navigation. Defaults to `undefined`.
* @param options.target The target attribute for the link. Defaults to `undefined`.
* @param options.viewTransition Enables a [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
* for this navigation. To apply specific styles during the transition, see
* {@link useViewTransitionState}. Defaults to `false`.
* @param options.defaultShouldRevalidate Specify the default revalidation
* behavior for the navigation. Defaults to `true`.
* @param options.mask Masked location to display in the browser instead
* of the router location. Defaults to `undefined`.
* @param options.useTransitions Wraps the navigation in
* [`React.startTransition`](https://react.dev/reference/react/startTransition)
* for concurrent rendering. Defaults to `false`.
* @returns A click handler function that can be used in a custom {@link Link} component.
*/
function useLinkClickHandler(to, { target, replace: replaceProp, mask, state, preventScrollReset, relative, viewTransition, defaultShouldRevalidate, useTransitions } = {}) {
	let navigate = useNavigate();
	let location = useLocation();
	let path = useResolvedPath(to, { relative });
	return React$1.useCallback((event) => {
		if (shouldProcessLinkClick(event, target)) {
			event.preventDefault();
			let replace = replaceProp !== void 0 ? replaceProp : createPath(location) === createPath(path);
			let doNavigate = () => navigate(to, {
				replace,
				mask,
				state,
				preventScrollReset,
				relative,
				viewTransition,
				defaultShouldRevalidate
			});
			if (useTransitions) React$1.startTransition(() => doNavigate());
			else doNavigate();
		}
	}, [
		location,
		navigate,
		path,
		replaceProp,
		mask,
		state,
		target,
		to,
		preventScrollReset,
		relative,
		viewTransition,
		defaultShouldRevalidate,
		useTransitions
	]);
}
/**
* Returns a tuple of the current URL's [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
* and a function to update them. Setting the search params causes a navigation.
*
* ```tsx
* import { useSearchParams } from "react-router";
*
* export function SomeComponent() {
*   const [searchParams, setSearchParams] = useSearchParams();
*   // ...
* }
* ```
*
* ### `setSearchParams` function
*
* The second element of the tuple is a function that can be used to update the
* search params. It accepts the same types as `defaultInit` and will cause a
* navigation to the new URL.
*
* ```tsx
* let [searchParams, setSearchParams] = useSearchParams();
*
* // a search param string
* setSearchParams("?tab=1");
*
* // a shorthand object
* setSearchParams({ tab: "1" });
*
* // object keys can be arrays for multiple values on the key
* setSearchParams({ brand: ["nike", "reebok"] });
*
* // an array of tuples
* setSearchParams([["tab", "1"]]);
*
* // a `URLSearchParams` object
* setSearchParams(new URLSearchParams("?tab=1"));
* ```
*
* It also supports a function callback like React's
* [`setState`](https://react.dev/reference/react/useState#setstate):
*
* ```tsx
* setSearchParams((searchParams) => {
*   searchParams.set("tab", "2");
*   return searchParams;
* });
* ```
*
* <docs-warning>The function callback version of `setSearchParams` does not support
* the [queueing](https://react.dev/reference/react/useState#setstate-parameters)
* logic that React's `setState` implements.  Multiple calls to `setSearchParams`
* in the same tick will not build on the prior value.  If you need this behavior,
* you can use `setState` manually.</docs-warning>
*
* ### Notes
*
* Note that `searchParams` is a stable reference, so you can reliably use it
* as a dependency in React's [`useEffect`](https://react.dev/reference/react/useEffect)
* hooks.
*
* ```tsx
* useEffect(() => {
*   console.log(searchParams.get("tab"));
* }, [searchParams]);
* ```
*
* However, this also means it's mutable. If you change the object without
* calling `setSearchParams`, its values will change between renders if some
* other state causes the component to re-render and URL will not reflect the
* values.
*
* @public
* @category Hooks
* @param defaultInit
* You can initialize the search params with a default value, though it **will
* not** change the URL on the first render.
*
* ```tsx
* // a search param string
* useSearchParams("?tab=1");
*
* // a shorthand object
* useSearchParams({ tab: "1" });
*
* // object keys can be arrays for multiple values on the key
* useSearchParams({ brand: ["nike", "reebok"] });
*
* // an array of tuples
* useSearchParams([["tab", "1"]]);
*
* // a `URLSearchParams` object
* useSearchParams(new URLSearchParams("?tab=1"));
* ```
* @returns A tuple of the current [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
* and a function to update them.
*/
function useSearchParams(defaultInit) {
	warning(typeof URLSearchParams !== "undefined", "You cannot use the `useSearchParams` hook in a browser that does not support the URLSearchParams API. If you need to support Internet Explorer 11, we recommend you load a polyfill such as https://github.com/ungap/url-search-params.");
	let defaultSearchParamsRef = React$1.useRef(createSearchParams(defaultInit));
	let hasSetSearchParamsRef = React$1.useRef(false);
	let location = useLocation();
	let searchParams = React$1.useMemo(() => getSearchParamsForLocation(location.search, hasSetSearchParamsRef.current ? null : defaultSearchParamsRef.current), [location.search]);
	let navigate = useNavigate();
	return [searchParams, React$1.useCallback((nextInit, navigateOptions) => {
		const newSearchParams = createSearchParams(typeof nextInit === "function" ? nextInit(new URLSearchParams(searchParams)) : nextInit);
		hasSetSearchParamsRef.current = true;
		navigate("?" + newSearchParams, navigateOptions);
	}, [navigate, searchParams])];
}
let fetcherId = 0;
let getUniqueFetcherId = () => `__${String(++fetcherId)}__`;
/**
* The imperative version of {@link Form | `<Form>`} that lets you submit a form
* from code instead of a user interaction.
*
* @example
* import { useSubmit } from "react-router";
*
* function SomeComponent() {
*   const submit = useSubmit();
*   return (
*     <Form onChange={(event) => submit(event.currentTarget)} />
*   );
* }
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @returns A function that can be called to submit a {@link Form} imperatively.
*/
function useSubmit() {
	let { router } = useDataRouterContext("useSubmit");
	let { basename } = React$1.useContext(NavigationContext);
	let currentRouteId = useRouteId();
	let routerFetch = router.fetch;
	let routerNavigate = router.navigate;
	return React$1.useCallback(async (target, options = {}) => {
		let { action, method, encType, formData, body } = getFormSubmissionInfo(target, basename);
		if (options.navigate === false) await routerFetch(options.fetcherKey || getUniqueFetcherId(), currentRouteId, options.action || action, {
			defaultShouldRevalidate: options.defaultShouldRevalidate,
			preventScrollReset: options.preventScrollReset,
			formData,
			body,
			formMethod: options.method || method,
			formEncType: options.encType || encType,
			flushSync: options.flushSync
		});
		else await routerNavigate(options.action || action, {
			defaultShouldRevalidate: options.defaultShouldRevalidate,
			preventScrollReset: options.preventScrollReset,
			formData,
			body,
			formMethod: options.method || method,
			formEncType: options.encType || encType,
			replace: options.replace,
			state: options.state,
			fromRouteId: currentRouteId,
			flushSync: options.flushSync,
			viewTransition: options.viewTransition
		});
	}, [
		routerFetch,
		routerNavigate,
		basename,
		currentRouteId
	]);
}
/**
* Resolves the URL to the closest route in the component hierarchy instead of
* the current URL of the app.
*
* This is used internally by {@link Form} to resolve the `action` to the closest
* route, but can be used generically as well.
*
* ```ts
* import { useFormAction } from "react-router";
*
* function SomeComponent() {
*   // closest route URL
*   let action = useFormAction();
*
*   // closest route URL + "destroy"
*   let destroyAction = useFormAction("destroy");
* }
* ```
*
* <docs-info>This hook adds a `basename` if your app specifies one, so that it
* can be used with raw `<form>` elements in a progressively enhanced way.  If
* you are using this to provide an `action` to `<Form>` or `fetcher.submit`, you
* will need to remove the `basename` since both of those will prepend it
* internally.</docs-info>
*
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @param action The action to append to the closest route URL. Defaults to the
* closest route URL.
* @param options Options
* @param options.relative The relative routing type to use when resolving the
* action. Defaults to `"route"`.
* @returns The resolved action URL.
*/
function useFormAction(action, { relative } = {}) {
	let { basename } = React$1.useContext(NavigationContext);
	let routeContext = React$1.useContext(RouteContext);
	invariant(routeContext, "useFormAction must be used inside a RouteContext");
	let [match] = routeContext.matches.slice(-1);
	let path = { ...useResolvedPath(action ? action : ".", { relative }) };
	let location = useLocation();
	if (action == null) {
		path.search = location.search;
		let params = new URLSearchParams(path.search);
		let indexValues = params.getAll("index");
		if (indexValues.some((v) => v === "")) {
			params.delete("index");
			indexValues.filter((v) => v).forEach((v) => params.append("index", v));
			let qs = params.toString();
			path.search = qs ? `?${qs}` : "";
		}
	}
	if ((!action || action === ".") && match.route.index) path.search = path.search ? path.search.replace(/^\?/, "?index&") : "?index";
	if (basename !== "/") path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
	return createPath(path);
}
/**
* Useful for creating complex, dynamic user interfaces that require multiple,
* concurrent data interactions without causing a navigation.
*
* Fetchers track their own, independent state and can be used to load data, submit
* forms, and generally interact with [`action`](../../start/framework/route-module#action)
* and [`loader`](../../start/framework/route-module#loader) functions.
*
* @example
* import { useFetcher } from "react-router"
*
* function SomeComponent() {
*   let fetcher = useFetcher()
*
*   // states are available on the fetcher
*   fetcher.state // "idle" | "loading" | "submitting"
*   fetcher.data // the data returned from the action or loader
*
*   // render a form
*   <fetcher.Form method="post" />
*
*   // load data
*   fetcher.load("/some/route")
*
*   // submit data
*   fetcher.submit(someFormRef, { method: "post" })
*   fetcher.submit(someData, {
*     method: "post",
*     encType: "application/json"
*   })
*
*   // reset fetcher
*   fetcher.reset()
* }
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @param options Options
* @param options.key A unique key to identify the fetcher.
*
*
* By default, `useFetcher` generates a unique fetcher scoped to that component.
* If you want to identify a fetcher with your own key such that you can access
* it from elsewhere in your app, you can do that with the `key` option:
*
* ```tsx
* function SomeComp() {
*   let fetcher = useFetcher({ key: "my-key" })
*   // ...
* }
*
* // Somewhere else
* function AnotherComp() {
*   // this will be the same fetcher, sharing the state across the app
*   let fetcher = useFetcher({ key: "my-key" });
*   // ...
* }
* ```
* @returns A {@link FetcherWithComponents} object that contains the fetcher's state, data, and components for submitting forms and loading data.
*/
function useFetcher({ key } = {}) {
	let { router } = useDataRouterContext("useFetcher");
	let state = useDataRouterState("useFetcher");
	let fetcherData = React$1.useContext(FetchersContext);
	let route = React$1.useContext(RouteContext);
	let routeId = route.matches[route.matches.length - 1]?.route.id;
	invariant(fetcherData, `useFetcher must be used inside a FetchersContext`);
	invariant(route, `useFetcher must be used inside a RouteContext`);
	invariant(routeId != null, `useFetcher can only be used on routes that contain a unique "id"`);
	let defaultKey = React$1.useId();
	let [fetcherKey, setFetcherKey] = React$1.useState(key || defaultKey);
	if (key && key !== fetcherKey) setFetcherKey(key);
	let { deleteFetcher, getFetcher, resetFetcher, fetch: routerFetch } = router;
	React$1.useEffect(() => {
		getFetcher(fetcherKey);
		return () => deleteFetcher(fetcherKey);
	}, [
		deleteFetcher,
		getFetcher,
		fetcherKey
	]);
	let load = React$1.useCallback(async (href, opts) => {
		invariant(routeId, "No routeId available for fetcher.load()");
		await routerFetch(fetcherKey, routeId, href, opts);
	}, [
		fetcherKey,
		routeId,
		routerFetch
	]);
	let submitImpl = useSubmit();
	let submit = React$1.useCallback(async (target, opts) => {
		await submitImpl(target, {
			...opts,
			navigate: false,
			fetcherKey
		});
	}, [fetcherKey, submitImpl]);
	let reset = React$1.useCallback((opts) => resetFetcher(fetcherKey, opts), [resetFetcher, fetcherKey]);
	let FetcherForm = React$1.useMemo(() => {
		let FetcherForm = React$1.forwardRef((props, ref) => {
			return /* @__PURE__ */ React$1.createElement(Form, {
				...props,
				navigate: false,
				fetcherKey,
				ref
			});
		});
		FetcherForm.displayName = "fetcher.Form";
		return FetcherForm;
	}, [fetcherKey]);
	let fetcher = state.fetchers.get(fetcherKey) || IDLE_FETCHER;
	let data = fetcherData.get(fetcherKey);
	return React$1.useMemo(() => ({
		Form: FetcherForm,
		submit,
		load,
		reset,
		...fetcher,
		data
	}), [
		FetcherForm,
		submit,
		load,
		reset,
		fetcher,
		data
	]);
}
/**
* Returns an array of all in-flight {@link Fetcher}s. This is useful for components
* throughout the app that didn't create the fetchers but want to use their submissions
* to participate in optimistic UI.
*
* @example
* import { useFetchers } from "react-router";
*
* function SomeComponent() {
*   const fetchers = useFetchers();
*   fetchers[0].formData; // FormData
*   fetchers[0].state; // etc.
*   // ...
* }
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @returns An array of all in-flight {@link Fetcher}s, each with a unique `key`
* property.
*/
function useFetchers() {
	let state = useDataRouterState("useFetchers");
	return React$1.useMemo(() => Array.from(state.fetchers.entries()).map(([key, fetcher]) => ({
		...fetcher,
		key
	})), [state.fetchers]);
}
const SCROLL_RESTORATION_STORAGE_KEY = "react-router-scroll-positions";
let savedScrollPositions = {};
function getScrollRestorationKey(location, matches, basename, getKey) {
	let key = null;
	if (getKey) if (basename !== "/") key = getKey({
		...location,
		pathname: stripBasename(location.pathname, basename) || location.pathname
	}, matches);
	else key = getKey(location, matches);
	if (key == null) key = location.key;
	return key;
}
/**
* When rendered inside a {@link RouterProvider}, will restore scroll positions
* on navigations
*
* <!--
* Not marked `@public` because we only export as UNSAFE_ and therefore we don't
* maintain an .md file for this hook
* -->
*
* @name UNSAFE_useScrollRestoration
* @category Hooks
* @mode framework
* @mode data
* @param options Options
* @param options.getKey A function that returns a key to use for scroll restoration.
* This is useful for custom scroll restoration logic, such as using only the pathname
* so that subsequent navigations to prior paths will restore the scroll. Defaults
* to `location.key`.
* @param options.storageKey The key to use for storing scroll positions in
* `sessionStorage`. Defaults to `"react-router-scroll-positions"`.
* @returns {void}
*/
function useScrollRestoration({ getKey, storageKey } = {}) {
	let { router } = useDataRouterContext("useScrollRestoration");
	let { restoreScrollPosition, preventScrollReset } = useDataRouterState("useScrollRestoration");
	let { basename } = React$1.useContext(NavigationContext);
	let location = useLocation();
	let matches = useMatches();
	let navigation = useNavigation();
	React$1.useEffect(() => {
		window.history.scrollRestoration = "manual";
		return () => {
			window.history.scrollRestoration = "auto";
		};
	}, []);
	usePageHide(React$1.useCallback(() => {
		if (navigation.state === "idle") {
			let key = getScrollRestorationKey(location, matches, basename, getKey);
			savedScrollPositions[key] = window.scrollY;
		}
		try {
			sessionStorage.setItem(storageKey || SCROLL_RESTORATION_STORAGE_KEY, JSON.stringify(savedScrollPositions));
		} catch (error) {
			warning(false, `Failed to save scroll positions in sessionStorage, <ScrollRestoration /> will not work properly (${error}).`);
		}
		window.history.scrollRestoration = "auto";
	}, [
		navigation.state,
		getKey,
		basename,
		location,
		matches,
		storageKey
	]));
	if (typeof document !== "undefined") {
		React$1.useLayoutEffect(() => {
			try {
				let sessionPositions = sessionStorage.getItem(storageKey || SCROLL_RESTORATION_STORAGE_KEY);
				if (sessionPositions) savedScrollPositions = JSON.parse(sessionPositions);
			} catch (e) {}
		}, [storageKey]);
		React$1.useLayoutEffect(() => {
			let disableScrollRestoration = router?.enableScrollRestoration(savedScrollPositions, () => window.scrollY, getKey ? (location, matches) => getScrollRestorationKey(location, matches, basename, getKey) : void 0);
			return () => disableScrollRestoration && disableScrollRestoration();
		}, [
			router,
			basename,
			getKey
		]);
		React$1.useLayoutEffect(() => {
			if (restoreScrollPosition === false) return;
			if (typeof restoreScrollPosition === "number") {
				window.scrollTo(0, restoreScrollPosition);
				return;
			}
			try {
				if (location.hash) {
					let el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
					if (el) {
						el.scrollIntoView();
						return;
					}
				}
			} catch {
				warning(false, `"${location.hash.slice(1)}" is not a decodable element ID. The view will not scroll to it.`);
			}
			if (preventScrollReset === true) return;
			window.scrollTo(0, 0);
		}, [
			location,
			restoreScrollPosition,
			preventScrollReset
		]);
	}
}
/**
* Set up a callback to be fired on [Window's `beforeunload` event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event).
*
* @public
* @category Hooks
* @param callback The callback to be called when the [`beforeunload` event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)
* is fired.
* @param options Options
* @param options.capture If `true`, the event will be captured during the capture
* phase. Defaults to `false`.
* @returns {void}
*/
function useBeforeUnload(callback, options) {
	let { capture } = options || {};
	React$1.useEffect(() => {
		let opts = capture != null ? { capture } : void 0;
		window.addEventListener("beforeunload", callback, opts);
		return () => {
			window.removeEventListener("beforeunload", callback, opts);
		};
	}, [callback, capture]);
}
function usePageHide(callback, options) {
	let { capture } = options || {};
	React$1.useEffect(() => {
		let opts = capture != null ? { capture } : void 0;
		window.addEventListener("pagehide", callback, opts);
		return () => {
			window.removeEventListener("pagehide", callback, opts);
		};
	}, [callback, capture]);
}
/**
* Wrapper around {@link useBlocker} to show a [`window.confirm`](https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm)
* prompt to users instead of building a custom UI with {@link useBlocker}.
*
* The `unstable_` flag will not be removed because this technique has a lot of
* rough edges and behaves very differently (and incorrectly sometimes) across
* browsers if users click addition back/forward navigations while the
* confirmation is open. Use at your own risk.
*
* @example
* function ImportantForm() {
*   let [value, setValue] = React.useState("");
*
*   // Block navigating elsewhere when data has been entered into the input
*   unstable_usePrompt({
*     message: "Are you sure?",
*     when: ({ currentLocation, nextLocation }) =>
*       value !== "" &&
*       currentLocation.pathname !== nextLocation.pathname,
*   });
*
*   return (
*     <Form method="post">
*       <label>
*         Enter some important data:
*         <input
*           name="data"
*           value={value}
*           onChange={(e) => setValue(e.target.value)}
*         />
*       </label>
*       <button type="submit">Save</button>
*     </Form>
*   );
* }
*
* @name unstable_usePrompt
* @public
* @category Hooks
* @mode framework
* @mode data
* @param options Options
* @param options.message The message to show in the confirmation dialog.
* @param options.when A boolean or a function that returns a boolean indicating
* whether to block the navigation. If a function is provided, it will receive an
* object with `currentLocation` and `nextLocation` properties.
* @returns {void}
*/
function usePrompt({ when, message }) {
	let blocker = useBlocker(when);
	React$1.useEffect(() => {
		if (blocker.state === "blocked") if (window.confirm(message)) setTimeout(blocker.proceed, 0);
		else blocker.reset();
	}, [blocker, message]);
	React$1.useEffect(() => {
		if (blocker.state === "blocked" && !when) blocker.reset();
	}, [blocker, when]);
}
/**
* This hook returns `true` when there is an active [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
* and the specified location matches either side of the navigation (the URL you are
* navigating **to** or the URL you are navigating **from**). This can be used to apply finer-grained styles to
* elements to further customize the view transition. This requires that view
* transitions have been enabled for the given navigation via {@link LinkProps.viewTransition}
* (or the `Form`, `submit`, or `navigate` call)
*
* @public
* @category Hooks
* @mode framework
* @mode data
* @param to The {@link To} location to compare against the active transition's current
* and next URLs.
* @param options Options
* @param options.relative The relative routing type to use when resolving the
* `to` location, defaults to `"route"`. See {@link RelativeRoutingType} for
* more details.
* @returns `true` if there is an active [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
* and the resolved path matches the transition's destination or source pathname, otherwise `false`.
*/
function useViewTransitionState(to, { relative } = {}) {
	let vtContext = React$1.useContext(ViewTransitionContext);
	invariant(vtContext != null, "`useViewTransitionState` must be used within `react-router/dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?");
	let { basename } = useDataRouterContext("useViewTransitionState");
	let path = useResolvedPath(to, { relative });
	if (!vtContext.isTransitioning) return false;
	let currentPath = stripBasename(vtContext.currentLocation.pathname, basename) || vtContext.currentLocation.pathname;
	let nextPath = stripBasename(vtContext.nextLocation.pathname, basename) || vtContext.nextLocation.pathname;
	return matchPath(path.pathname, nextPath) != null || matchPath(path.pathname, currentPath) != null;
}
//#endregion
export { BrowserRouter, Form, HashRouter, HistoryRouter, Link, NavLink, ScrollRestoration, createBrowserRouter, createHashRouter, useBeforeUnload, useFetcher, useFetchers, useFormAction, useLinkClickHandler, usePrompt, useScrollRestoration, useSearchParams, useSubmit, useViewTransitionState };
