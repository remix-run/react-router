/**
 * react-router v8.3.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { ABSOLUTE_URL_REGEX } from "../router/url.js";
import { createPath, invariant, parsePath } from "../router/history.js";
import { convertRoutesToDataRoutes, isRouteErrorResponse } from "../router/utils.js";
import { IDLE_BLOCKER, IDLE_FETCHER, IDLE_NAVIGATION } from "../router/router.js";
import { DataRouterContext, DataRouterStateContext, FetchersContext, ViewTransitionContext } from "../context.js";
import { DataRoutes, Router } from "../components.js";
import { escapeHtml } from "./ssr/markup.js";
import * as React$1 from "react";
//#region lib/dom/server.tsx
/**
* A {@link Router | `<Router>`} that may not navigate to any other {@link Location}.
* This is useful on the server where there is no stateful UI.
*
* @public
* @category Declarative Routers
* @mode declarative
* @param props Props
* @param {StaticRouterProps.basename} props.basename n/a
* @param {StaticRouterProps.children} props.children n/a
* @param {StaticRouterProps.location} props.location n/a
* @returns A React element that renders the static {@link Router | `<Router>`}
*/
function StaticRouter({ basename, children, location: locationProp = "/" }) {
	if (typeof locationProp === "string") locationProp = parsePath(locationProp);
	let action = "POP";
	let location = {
		pathname: locationProp.pathname || "/",
		search: locationProp.search || "",
		hash: locationProp.hash || "",
		state: locationProp.state != null ? locationProp.state : null,
		key: locationProp.key || "default",
		mask: void 0
	};
	let staticNavigator = getStatelessNavigator();
	return /* @__PURE__ */ React$1.createElement(Router, {
		basename,
		children,
		location,
		navigationType: action,
		navigator: staticNavigator,
		static: true,
		useTransitions: false
	});
}
/**
* A {@link DataRouter} that may not navigate to any other {@link Location}.
* This is useful on the server where there is no stateful UI.
*
* @example
* export async function handleRequest(request: Request) {
*   let { query, dataRoutes } = createStaticHandler(routes);
*   let context = await query(request));
*
*   if (context instanceof Response) {
*     return context;
*   }
*
*   let router = createStaticRouter(dataRoutes, context);
*   return new Response(
*     ReactDOMServer.renderToString(<StaticRouterProvider ... />),
*     { headers: { "Content-Type": "text/html" } }
*   );
* }
*
* @public
* @category Data Routers
* @mode data
* @param props Props
* @param {StaticRouterProviderProps.context} props.context n/a
* @param {StaticRouterProviderProps.hydrate} props.hydrate n/a
* @param {StaticRouterProviderProps.nonce} props.nonce n/a
* @param {StaticRouterProviderProps.router} props.router n/a
* @returns A React element that renders the static router provider
*/
function StaticRouterProvider({ context, router, hydrate = true, nonce }) {
	invariant(router && context, "You must provide `router` and `context` to <StaticRouterProvider>");
	let dataRouterContext = {
		router,
		navigator: getStatelessNavigator(),
		static: true,
		staticContext: context,
		basename: context.basename || "/"
	};
	let fetchersContext = /* @__PURE__ */ new Map();
	let hydrateScript = "";
	if (hydrate !== false) {
		let data = {
			loaderData: context.loaderData,
			actionData: context.actionData,
			errors: serializeErrors(context.errors)
		};
		hydrateScript = `window.__staticRouterHydrationData = JSON.parse(${escapeHtml(JSON.stringify(JSON.stringify(data)))});`;
	}
	let { state } = dataRouterContext.router;
	return /* @__PURE__ */ React$1.createElement(React$1.Fragment, null, /* @__PURE__ */ React$1.createElement(DataRouterContext.Provider, { value: dataRouterContext }, /* @__PURE__ */ React$1.createElement(DataRouterStateContext.Provider, { value: state }, /* @__PURE__ */ React$1.createElement(FetchersContext.Provider, { value: fetchersContext }, /* @__PURE__ */ React$1.createElement(ViewTransitionContext.Provider, { value: { isTransitioning: false } }, /* @__PURE__ */ React$1.createElement(Router, {
		basename: dataRouterContext.basename,
		location: state.location,
		navigationType: state.historyAction,
		navigator: dataRouterContext.navigator,
		static: dataRouterContext.static,
		useTransitions: false
	}, /* @__PURE__ */ React$1.createElement(DataRoutes, {
		manifest: router.manifest,
		routes: router.routes,
		future: router.future,
		state,
		isStatic: true
	})))))), hydrateScript ? /* @__PURE__ */ React$1.createElement("script", {
		suppressHydrationWarning: true,
		nonce,
		dangerouslySetInnerHTML: { __html: hydrateScript }
	}) : null);
}
function serializeErrors(errors) {
	if (!errors) return null;
	let entries = Object.entries(errors);
	let serialized = {};
	for (let [key, val] of entries) if (isRouteErrorResponse(val)) serialized[key] = {
		...val,
		__type: "RouteErrorResponse"
	};
	else if (val instanceof Error) serialized[key] = {
		message: val.message,
		__type: "Error",
		...val.name !== "Error" ? { __subType: val.name } : {}
	};
	else serialized[key] = val;
	return serialized;
}
function getStatelessNavigator() {
	return {
		createHref,
		encodeLocation,
		push(to) {
			throw new Error(`You cannot use navigator.push() on the server because it is a stateless environment. This error was probably triggered when you did a \`navigate(${JSON.stringify(to)})\` somewhere in your app.`);
		},
		replace(to) {
			throw new Error(`You cannot use navigator.replace() on the server because it is a stateless environment. This error was probably triggered when you did a \`navigate(${JSON.stringify(to)}, { replace: true })\` somewhere in your app.`);
		},
		go(delta) {
			throw new Error(`You cannot use navigator.go() on the server because it is a stateless environment. This error was probably triggered when you did a \`navigate(${delta})\` somewhere in your app.`);
		},
		back() {
			throw new Error("You cannot use navigator.back() on the server because it is a stateless environment.");
		},
		forward() {
			throw new Error("You cannot use navigator.forward() on the server because it is a stateless environment.");
		}
	};
}
/**
* Create a static {@link DataRouter} for server-side rendering
*
* @example
* export async function handleRequest(request: Request) {
*   let { query, dataRoutes } = createStaticHandler(routes);
*   let context = await query(request);
*
*   if (context instanceof Response) {
*     return context;
*   }
*
*   let router = createStaticRouter(dataRoutes, context);
*   return new Response(
*     ReactDOMServer.renderToString(<StaticRouterProvider ... />),
*     { headers: { "Content-Type": "text/html" } }
*   );
* }
*
* @public
* @category Data Routers
* @mode data
* @param routes The route objects to create a static {@link DataRouter} for
* @param context The {@link StaticHandlerContext} returned from {@link StaticHandler}'s
* `query`
* @param opts Options
* @param opts.future Future flags for the static {@link DataRouter}
* @param opts.branches Optional pre-computed route branches
* @returns A static {@link DataRouter} that can be used to render the provided routes
*/
function createStaticRouter(routes, context, opts = {}) {
	let manifest = {};
	let dataRoutes = convertRoutesToDataRoutes(routes, void 0, void 0, manifest);
	let matches = context.matches.map((match) => {
		let route = manifest[match.route.id] || match.route;
		return {
			...match,
			route
		};
	});
	let msg = (method) => `You cannot use router.${method}() on the server because it is a stateless environment`;
	return {
		get basename() {
			return context.basename;
		},
		get future() {
			return { ...opts?.future };
		},
		get state() {
			return {
				historyAction: "POP",
				location: context.location,
				matches,
				loaderData: context.loaderData,
				actionData: context.actionData,
				errors: context.errors,
				initialized: true,
				renderFallback: false,
				navigation: IDLE_NAVIGATION,
				restoreScrollPosition: null,
				preventScrollReset: false,
				revalidation: "idle",
				fetchers: /* @__PURE__ */ new Map(),
				blockers: /* @__PURE__ */ new Map()
			};
		},
		get routes() {
			return dataRoutes;
		},
		get branches() {
			return opts.branches;
		},
		get manifest() {
			return manifest;
		},
		get window() {},
		initialize() {
			throw msg("initialize");
		},
		subscribe() {
			throw msg("subscribe");
		},
		enableScrollRestoration() {
			throw msg("enableScrollRestoration");
		},
		navigate() {
			throw msg("navigate");
		},
		fetch() {
			throw msg("fetch");
		},
		revalidate() {
			throw msg("revalidate");
		},
		createHref,
		encodeLocation,
		getFetcher() {
			return IDLE_FETCHER;
		},
		deleteFetcher() {
			throw msg("deleteFetcher");
		},
		resetFetcher() {
			throw msg("resetFetcher");
		},
		dispose() {
			throw msg("dispose");
		},
		getBlocker() {
			return IDLE_BLOCKER;
		},
		deleteBlocker() {
			throw msg("deleteBlocker");
		},
		patchRoutes() {
			throw msg("patchRoutes");
		},
		_internalFetchControllers: /* @__PURE__ */ new Map(),
		_internalSetRoutes() {
			throw msg("_internalSetRoutes");
		},
		_internalSetStateDoNotUseOrYouWillBreakYourApp() {
			throw msg("_internalSetStateDoNotUseOrYouWillBreakYourApp");
		}
	};
}
function createHref(to) {
	return typeof to === "string" ? to : createPath(to);
}
function encodeLocation(to) {
	let href = typeof to === "string" ? to : createPath(to);
	href = href.replace(/ $/, "%20");
	let encoded = ABSOLUTE_URL_REGEX.test(href) ? new URL(href) : new URL(href, "http://localhost");
	return {
		pathname: encoded.pathname,
		search: encoded.search,
		hash: encoded.hash
	};
}
//#endregion
export { StaticRouter, StaticRouterProvider, createStaticRouter };
