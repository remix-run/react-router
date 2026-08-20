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
import { PROTOCOL_RELATIVE_URL_REGEX } from "../router/url.js";
import { createBrowserHistory, createPath, invariant } from "../router/history.js";
import { ErrorResponseImpl, createContext, resolvePath } from "../router/utils.js";
import { createRouter, hasInvalidProtocol, isMutationMethod } from "../router/router.js";
import { RSCRouterContext } from "../context.js";
import { RouterProvider } from "../components.js";
import { createRequestInit } from "../dom/ssr/data.js";
import { getSingleFetchDataStrategyImpl, singleFetchUrl, stripIndexParam } from "../dom/ssr/single-fetch.js";
import { noActionDefinedError, shouldHydrateRouteLoader } from "../dom/ssr/routes.js";
import { getPathsWithAncestors, handleClientVersionMismatch } from "../dom/ssr/fog-of-war.js";
import { FrameworkContext, setIsHydrated } from "../dom/ssr/components.js";
import { RSCRouterGlobalErrorBoundary } from "./errorBoundaries.js";
import { populateRSCRouteModules } from "./route-modules.js";
import { getHydrationData } from "../dom/ssr/hydration.js";
import * as React$1 from "react";
import * as ReactDOM from "react-dom";
//#region lib/rsc/browser.tsx
const defaultManifestPath = "/__manifest";
/**
* Create a React `callServer` implementation for React Router.
*
* @example
* import {
*   createFromReadableStream,
*   createTemporaryReferenceSet,
*   encodeReply,
*   setServerCallback,
* } from "@vitejs/plugin-rsc/browser";
* import { unstable_createCallServer as createCallServer } from "react-router";
*
* setServerCallback(
*   createCallServer({
*     createFromReadableStream,
*     createTemporaryReferenceSet,
*     encodeReply,
*   })
* );
*
* @name unstable_createCallServer
* @public
* @category RSC
* @mode data
* @param opts Options
* @param opts.createFromReadableStream Your `react-server-dom-xyz/client`'s
* `createFromReadableStream`. Used to decode payloads from the server.
* @param opts.createTemporaryReferenceSet A function that creates a temporary
* reference set for the [RSC](https://react.dev/reference/rsc/server-components)
* payload.
* @param opts.encodeReply Your `react-server-dom-xyz/client`'s `encodeReply`.
* Used when sending payloads to the server.
* @param opts.fetch Optional [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
* implementation. Defaults to global [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch).
* @returns A function that can be used to call server actions.
*/
function createCallServer({ createFromReadableStream, createTemporaryReferenceSet, encodeReply, fetch: fetchImplementation = fetch }) {
	const globalVar = window;
	let landedActionId = 0;
	return async (id, args) => {
		let actionId = globalVar.__routerActionID = (globalVar.__routerActionID ??= 0) + 1;
		const temporaryReferences = createTemporaryReferenceSet();
		const payloadPromise = fetchImplementation(new Request(location.href, {
			body: await encodeReply(args, { temporaryReferences }),
			method: "POST",
			headers: {
				Accept: "text/x-component",
				"rsc-action-id": id
			}
		})).then((response) => {
			if (!response.body) throw new Error("No response body");
			return createFromReadableStream(response.body, { temporaryReferences });
		});
		React$1.startTransition(() => Promise.resolve(payloadPromise).then(async (payload) => {
			if (payload.type === "redirect") {
				let location = normalizeRedirectLocation(payload.location);
				if (payload.reload || isExternalLocation(location)) {
					if (hasInvalidProtocol(location)) throw new Error("Invalid redirect location");
					window.location.href = location;
					return;
				}
				React$1.startTransition(() => {
					globalVar.__reactRouterDataRouter.navigate(location, { replace: payload.replace });
				});
				return;
			}
			if (payload.type !== "action") throw new Error("Unexpected payload type");
			const rerender = await payload.rerender;
			if (rerender && landedActionId < actionId && globalVar.__routerActionID <= actionId) {
				if (rerender.type === "redirect") {
					let location = normalizeRedirectLocation(rerender.location);
					if (rerender.reload || isExternalLocation(location)) {
						if (hasInvalidProtocol(location)) throw new Error("Invalid redirect location");
						window.location.href = location;
						return;
					}
					React$1.startTransition(() => {
						globalVar.__reactRouterDataRouter.navigate(location, { replace: rerender.replace });
					});
					return;
				}
				React$1.startTransition(() => {
					let lastMatch;
					for (const match of rerender.matches) {
						globalVar.__reactRouterDataRouter.patchRoutes(lastMatch?.id ?? null, [createRouteFromServerManifest(match)], true);
						lastMatch = match;
					}
					window.__reactRouterDataRouter._internalSetStateDoNotUseOrYouWillBreakYourApp({
						loaderData: Object.assign({}, globalVar.__reactRouterDataRouter.state.loaderData, rerender.loaderData),
						errors: rerender.errors ? Object.assign({}, globalVar.__reactRouterDataRouter.state.errors, rerender.errors) : null
					});
				});
			}
		}).catch(() => {}));
		return payloadPromise.then((payload) => {
			if (payload.type !== "action" && payload.type !== "redirect") throw new Error("Unexpected payload type");
			return payload.actionResult;
		});
	};
}
function createRouterFromPayload({ fetchImplementation, createFromReadableStream, getContext, payload }) {
	const globalVar = window;
	if (globalVar.__reactRouterDataRouter && globalVar.__reactRouterRouteModules) return {
		router: globalVar.__reactRouterDataRouter,
		routeModules: globalVar.__reactRouterRouteModules
	};
	if (payload.type !== "render") throw new Error("Invalid payload type");
	let { clientVersion } = payload;
	globalVar.__reactRouterRouteModules = globalVar.__reactRouterRouteModules ?? {};
	populateRSCRouteModules(globalVar.__reactRouterRouteModules, payload.matches);
	let routes = payload.matches.reduceRight((previous, match) => {
		const route = createRouteFromServerManifest(match, payload);
		if (previous.length > 0) route.children = previous;
		else if (!route.index) route.children = [];
		return [route];
	}, []);
	let applyPatchesPromise;
	globalVar.__reactRouterDataRouter = createRouter({
		routes,
		getContext,
		basename: payload.basename,
		history: createBrowserHistory(),
		hydrationData: getHydrationData({
			state: {
				loaderData: payload.loaderData,
				actionData: payload.actionData,
				errors: payload.errors
			},
			routes,
			getRouteInfo: (routeId) => {
				let match = payload.matches.find((m) => m.id === routeId);
				invariant(match, "Route not found in payload");
				return {
					clientLoader: match.clientLoader,
					hasLoader: match.hasLoader,
					hasHydrateFallback: match.hydrateFallbackElement != null
				};
			},
			location: payload.location,
			basename: payload.basename,
			isSpaMode: false
		}),
		async patchRoutesOnNavigation({ path, signal, fetcherKey }) {
			if (payload.routeDiscovery.mode === "initial") {
				if (!applyPatchesPromise) applyPatchesPromise = (async () => {
					if (!payload.patches) return;
					let patches = await payload.patches;
					React$1.startTransition(() => {
						patches.forEach((p) => {
							window.__reactRouterDataRouter.patchRoutes(p.parentId ?? null, [createRouteFromServerManifest(p)]);
						});
					});
				})();
				await applyPatchesPromise;
				return;
			}
			if (discoveredPaths.has(path)) return;
			let { state } = globalVar.__reactRouterDataRouter;
			await fetchAndApplyManifestPatches([path], createFromReadableStream, fetchImplementation, clientVersion, fetcherKey ? window.location.href : createPath(state.navigation.location || state.location), signal);
		},
		dataStrategy: getRSCSingleFetchDataStrategy(() => globalVar.__reactRouterDataRouter, true, createFromReadableStream, fetchImplementation, clientVersion)
	});
	if (globalVar.__reactRouterDataRouter.state.initialized) {
		globalVar.__routerInitialized = true;
		globalVar.__reactRouterDataRouter.initialize();
	} else globalVar.__routerInitialized = false;
	let lastLoaderData = void 0;
	globalVar.__reactRouterDataRouter.subscribe(({ loaderData, actionData }) => {
		if (lastLoaderData !== loaderData) globalVar.__routerActionID = (globalVar.__routerActionID ??= 0) + 1;
	});
	globalVar.__reactRouterDataRouter._updateRoutesForHMR = (routeUpdateByRouteId) => {
		const oldRoutes = window.__reactRouterDataRouter.routes;
		const newRoutes = [];
		function walkRoutes(routes, parentId) {
			return routes.map((route) => {
				const routeUpdate = routeUpdateByRouteId.get(route.id);
				if (routeUpdate) {
					const { routeModule, hasAction, hasComponent, hasLoader } = routeUpdate;
					const newRoute = createRouteFromServerManifest({
						clientAction: routeModule.clientAction,
						clientLoader: routeModule.clientLoader,
						element: route.element,
						errorElement: route.errorElement,
						handle: route.handle,
						hasAction,
						hasComponent,
						hasLoader,
						hydrateFallbackElement: route.hydrateFallbackElement,
						id: route.id,
						index: route.index,
						links: routeModule.links,
						meta: routeModule.meta,
						parentId,
						path: route.path,
						shouldRevalidate: routeModule.shouldRevalidate
					});
					if (route.children) newRoute.children = walkRoutes(route.children, route.id);
					return newRoute;
				}
				const updatedRoute = { ...route };
				if (route.children) updatedRoute.children = walkRoutes(route.children, route.id);
				return updatedRoute;
			});
		}
		newRoutes.push(...walkRoutes(oldRoutes, void 0));
		window.__reactRouterDataRouter._internalSetRoutes(newRoutes);
	};
	return {
		router: globalVar.__reactRouterDataRouter,
		routeModules: globalVar.__reactRouterRouteModules
	};
}
const renderedRoutesContext = createContext();
function getRSCSingleFetchDataStrategy(getRouter, ssr, createFromReadableStream, fetchImplementation, clientVersion) {
	let dataStrategy = getSingleFetchDataStrategyImpl(getRouter, (match) => {
		let M = match;
		return {
			hasLoader: M.route.hasLoader,
			hasClientLoader: M.route.hasClientLoader
		};
	}, getFetchAndDecodeViaRSC(getRouter, createFromReadableStream, fetchImplementation, clientVersion), ssr, (match) => {
		let M = match;
		return !M.route.hasComponent || M.route.element != null;
	});
	return async (args) => args.runClientMiddleware(async () => {
		args.context.set(renderedRoutesContext, []);
		let results = await dataStrategy(args);
		const renderedRoutesById = /* @__PURE__ */ new Map();
		for (const route of args.context.get(renderedRoutesContext)) {
			if (!renderedRoutesById.has(route.id)) renderedRoutesById.set(route.id, []);
			renderedRoutesById.get(route.id).push(route);
		}
		React$1.startTransition(() => {
			for (const match of args.matches) {
				const renderedRoutes = renderedRoutesById.get(match.route.id);
				if (renderedRoutes) for (const rendered of renderedRoutes) window.__reactRouterDataRouter.patchRoutes(rendered.parentId ?? null, [createRouteFromServerManifest(rendered)], true);
			}
		});
		return results;
	});
}
function getFetchAndDecodeViaRSC(getRouter, createFromReadableStream, fetchImplementation, clientVersion) {
	return async (args, targetRoutes) => {
		let { request, context } = args;
		let url = singleFetchUrl(request.url, "rsc");
		if (request.method === "GET") {
			url = stripIndexParam(url);
			if (targetRoutes) url.searchParams.set("_routes", targetRoutes.join(","));
		}
		let res = await fetchImplementation(new Request(url, await createRequestInit(request)));
		if (res.status >= 400 && !res.headers.has("X-Remix-Response")) throw new ErrorResponseImpl(res.status, res.statusText, await res.text());
		invariant(res.body, "No response body to decode");
		try {
			const payload = await createFromReadableStream(res.body, { temporaryReferences: void 0 });
			if (payload.type === "redirect") return {
				status: res.status,
				data: { redirect: {
					redirect: payload.location,
					reload: payload.reload,
					replace: payload.replace,
					revalidate: false,
					status: payload.status
				} }
			};
			if (payload.type !== "render") throw new Error("Unexpected payload type");
			if (clientVersion !== void 0 && await handleClientVersionMismatch(payload.clientVersion !== clientVersion, clientVersion, createPath(getRouter().state.navigation.location || getRouter().state.location))) return new Promise(() => {});
			context.get(renderedRoutesContext).push(...payload.matches);
			let results = { routes: {} };
			const dataKey = isMutationMethod(request.method) ? "actionData" : "loaderData";
			for (let [routeId, data] of Object.entries(payload[dataKey] || {})) results.routes[routeId] = { data };
			if (payload.errors) for (let [routeId, error] of Object.entries(payload.errors)) results.routes[routeId] = { error };
			return {
				status: res.status,
				data: results
			};
		} catch (cause) {
			throw new Error("Unable to decode RSC response", { cause });
		}
	};
}
/**
* Hydrates a server rendered {@link unstable_RSCPayload} in the browser.
*
* @example
* import { startTransition, StrictMode } from "react";
* import { hydrateRoot } from "react-dom/client";
* import {
*   unstable_getRSCStream as getRSCStream,
*   unstable_RSCHydratedRouter as RSCHydratedRouter,
* } from "react-router";
* import type { unstable_RSCPayload as RSCPayload } from "react-router";
*
* createFromReadableStream(getRSCStream()).then((payload) =>
*   startTransition(async () => {
*     hydrateRoot(
*       document,
*       <StrictMode>
*         <RSCHydratedRouter
*           createFromReadableStream={createFromReadableStream}
*           payload={payload}
*         />
*       </StrictMode>,
*       { formState: await getFormState(payload) },
*     );
*   }),
* );
*
* @name unstable_RSCHydratedRouter
* @public
* @category RSC
* @mode data
* @param props Props
* @param {unstable_RSCHydratedRouterProps.createFromReadableStream} props.createFromReadableStream n/a
* @param {unstable_RSCHydratedRouterProps.fetch} props.fetch n/a
* @param {unstable_RSCHydratedRouterProps.getContext} props.getContext n/a
* @param {unstable_RSCHydratedRouterProps.payload} props.payload n/a
* @returns A hydrated {@link DataRouter} that can be used to navigate and
* render routes.
*/
function RSCHydratedRouter({ createFromReadableStream, fetch: fetchImplementation = fetch, payload, getContext }) {
	if (payload.type !== "render") throw new Error("Invalid payload type");
	let { routeDiscovery, clientVersion } = payload;
	let { router, routeModules } = React$1.useMemo(() => createRouterFromPayload({
		payload,
		fetchImplementation,
		getContext,
		createFromReadableStream
	}), [
		createFromReadableStream,
		payload,
		fetchImplementation,
		getContext
	]);
	React$1.useEffect(() => {
		setIsHydrated();
	}, []);
	React$1.useLayoutEffect(() => {
		const globalVar = window;
		if (!globalVar.__routerInitialized) {
			globalVar.__routerInitialized = true;
			globalVar.__reactRouterDataRouter.initialize();
		}
	}, []);
	let [{ routes, state }, setState] = React$1.useState(() => ({
		routes: cloneRoutes(router.routes),
		state: router.state
	}));
	React$1.useLayoutEffect(() => router.subscribe((newState) => {
		if (diffRoutes(router.routes, routes)) React$1.startTransition(() => {
			setState({
				routes: cloneRoutes(router.routes),
				state: newState
			});
		});
	}), [
		router.subscribe,
		routes,
		router
	]);
	const transitionEnabledRouter = React$1.useMemo(() => ({
		...router,
		state,
		routes
	}), [
		router,
		routes,
		state
	]);
	React$1.useEffect(() => {
		if (routeDiscovery.mode === "initial" || window.navigator?.connection?.saveData === true) return;
		function registerElement(el) {
			let path = el.tagName === "FORM" ? el.getAttribute("action") : el.getAttribute("href");
			if (!path) return;
			let pathname = el.tagName === "A" ? el.pathname : new URL(path, window.location.origin).pathname;
			if (!discoveredPaths.has(pathname)) nextPaths.add(pathname);
		}
		async function fetchPatches() {
			document.querySelectorAll("a[data-discover], form[data-discover]").forEach(registerElement);
			let paths = Array.from(nextPaths.keys()).filter((path) => {
				if (discoveredPaths.has(path)) {
					nextPaths.delete(path);
					return false;
				}
				return true;
			});
			if (paths.length === 0) return;
			try {
				await fetchAndApplyManifestPatches(paths, createFromReadableStream, fetchImplementation, clientVersion, null);
			} catch (e) {
				console.error("Failed to fetch manifest patches", e);
			}
		}
		let debouncedFetchPatches = debounce(fetchPatches, 100);
		fetchPatches();
		new MutationObserver(() => debouncedFetchPatches()).observe(document.documentElement, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: [
				"data-discover",
				"href",
				"action"
			]
		});
	}, [
		routeDiscovery,
		createFromReadableStream,
		fetchImplementation,
		clientVersion
	]);
	const frameworkContext = {
		future: {},
		isSpaMode: false,
		ssr: true,
		criticalCss: "",
		manifest: {
			routes: {},
			version: "1",
			url: "",
			entry: {
				module: "",
				imports: []
			}
		},
		routeDiscovery: payload.routeDiscovery.mode === "initial" ? {
			mode: "initial",
			manifestPath: defaultManifestPath
		} : {
			mode: "lazy",
			manifestPath: payload.routeDiscovery.manifestPath || defaultManifestPath
		},
		routeModules
	};
	return /* @__PURE__ */ React$1.createElement(RSCRouterContext.Provider, { value: true }, /* @__PURE__ */ React$1.createElement(RSCRouterGlobalErrorBoundary, { location: state.location }, /* @__PURE__ */ React$1.createElement(FrameworkContext.Provider, { value: frameworkContext }, /* @__PURE__ */ React$1.createElement(RouterProvider, {
		router: transitionEnabledRouter,
		flushSync: ReactDOM.flushSync
	}))));
}
function createRouteFromServerManifest(match, payload) {
	let hasInitialData = payload && match.id in payload.loaderData;
	let initialData = payload?.loaderData[match.id];
	let hasInitialError = payload?.errors && match.id in payload.errors;
	let initialError = payload?.errors?.[match.id];
	let isHydrationRequest = match.clientLoader?.hydrate === true || !match.hasLoader || match.hasComponent && !match.element;
	invariant(window.__reactRouterRouteModules);
	populateRSCRouteModules(window.__reactRouterRouteModules, match);
	let dataRoute = {
		id: match.id,
		element: match.element,
		errorElement: match.errorElement,
		handle: match.handle,
		hydrateFallbackElement: match.hydrateFallbackElement,
		index: match.index,
		loader: match.clientLoader ? async (args, singleFetch) => {
			let _isHydrationRequest = isHydrationRequest;
			isHydrationRequest = false;
			return await match.clientLoader({
				...args,
				serverLoader: () => {
					preventInvalidServerHandlerCall("loader", match.id, match.hasLoader);
					if (_isHydrationRequest) {
						if (hasInitialData) return initialData;
						if (hasInitialError) throw initialError;
					}
					return callSingleFetch(singleFetch);
				}
			});
		} : (_, singleFetch) => callSingleFetch(singleFetch),
		action: match.clientAction ? (args, singleFetch) => match.clientAction({
			...args,
			serverAction: async () => {
				preventInvalidServerHandlerCall("action", match.id, match.hasLoader);
				return await callSingleFetch(singleFetch);
			}
		}) : match.hasAction ? (_, singleFetch) => callSingleFetch(singleFetch) : () => {
			throw noActionDefinedError("action", match.id);
		},
		path: match.path,
		shouldRevalidate: match.shouldRevalidate,
		hasLoader: true,
		hasClientLoader: match.clientLoader != null,
		hasComponent: match.hasComponent,
		hasAction: match.hasAction,
		hasClientAction: match.clientAction != null
	};
	if (typeof dataRoute.loader === "function") dataRoute.loader.hydrate = shouldHydrateRouteLoader(match.id, match.clientLoader, match.hasLoader, false);
	return dataRoute;
}
function callSingleFetch(singleFetch) {
	invariant(typeof singleFetch === "function", "Invalid singleFetch parameter");
	return singleFetch();
}
function preventInvalidServerHandlerCall(type, routeId, hasHandler) {
	if (!hasHandler) {
		let msg = `You are trying to call ${type === "action" ? "serverAction()" : "serverLoader()"} on a route that does not have a server ${type} (routeId: "${routeId}")`;
		console.error(msg);
		throw new ErrorResponseImpl(400, "Bad Request", new Error(msg), true);
	}
}
const nextPaths = /* @__PURE__ */ new Set();
const discoveredPathsMaxSize = 1e3;
const discoveredPaths = /* @__PURE__ */ new Set();
function getManifestUrl(paths, clientVersion) {
	if (paths.length === 0) return null;
	let url;
	if (paths.length === 1) url = new URL(`${paths[0]}.manifest`, window.location.origin);
	else {
		let basename = (window.__reactRouterDataRouter.basename ?? "").replace(/^\/|\/$/g, "");
		url = new URL(`${basename}/.manifest`, window.location.origin);
		url.searchParams.set("paths", paths.sort().join(","));
	}
	if (clientVersion !== void 0) url.searchParams.set("version", clientVersion);
	return url;
}
async function fetchAndApplyManifestPatches(paths, createFromReadableStream, fetchImplementation, clientVersion, errorReloadPath, signal) {
	paths = getPathsWithAncestors(paths);
	let url = getManifestUrl(paths, clientVersion);
	if (url == null) return;
	if (url.toString().length > 7680) {
		nextPaths.clear();
		return;
	}
	let response = await fetchImplementation(new Request(url, { signal }));
	if (clientVersion !== void 0 && response.status === 204 && response.headers.has("X-Remix-Reload-Document")) {
		await handleClientVersionMismatch(true, clientVersion, errorReloadPath);
		return;
	}
	if (!response.body || response.status < 200 || response.status >= 300) throw new Error("Unable to fetch new route matches from the server");
	let payload = await createFromReadableStream(response.body, { temporaryReferences: void 0 });
	if (payload.type !== "manifest") throw new Error("Failed to patch routes");
	paths.forEach((p) => addToFifoQueue(p, discoveredPaths));
	let patches = await payload.patches;
	React$1.startTransition(() => {
		patches.forEach((p) => {
			window.__reactRouterDataRouter.patchRoutes(p.parentId ?? null, [createRouteFromServerManifest(p)]);
		});
	});
}
function addToFifoQueue(path, queue) {
	if (queue.size >= discoveredPathsMaxSize) {
		let first = queue.values().next().value;
		if (typeof first === "string") queue.delete(first);
	}
	queue.add(path);
}
function debounce(callback, wait) {
	let timeoutId;
	return (...args) => {
		window.clearTimeout(timeoutId);
		timeoutId = window.setTimeout(() => callback(...args), wait);
	};
}
function isExternalLocation(location) {
	return new URL(location, window.location.href).origin !== window.location.origin;
}
function normalizeRedirectLocation(location) {
	if (PROTOCOL_RELATIVE_URL_REGEX.test(location)) {
		let path = resolvePath(location);
		return path.pathname + path.search + path.hash;
	}
	return location;
}
function cloneRoutes(routes) {
	if (!routes) return void 0;
	return routes.map((route) => ({
		...route,
		children: cloneRoutes(route.children)
	}));
}
function diffRoutes(a, b) {
	if (a.length !== b.length) return true;
	return a.some((route, index) => {
		if (route.element !== b[index].element) return true;
		if (route.errorElement !== b[index].errorElement) return true;
		if (route.hydrateFallbackElement !== b[index].hydrateFallbackElement) return true;
		if (route.hasLoader !== b[index].hasLoader) return true;
		if (route.hasClientLoader !== b[index].hasClientLoader) return true;
		if (route.hasAction !== b[index].hasAction) return true;
		if (route.hasClientAction !== b[index].hasClientAction) return true;
		return diffRoutes(route.children || [], b[index].children || []);
	});
}
//#endregion
export { RSCHydratedRouter, createCallServer };
