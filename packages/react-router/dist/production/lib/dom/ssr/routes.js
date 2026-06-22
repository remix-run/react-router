/**
 * react-router v8.0.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { ErrorResponseImpl, compilePath } from "../../router/utils.js";
import { useRouteError } from "../../hooks.js";
import invariant from "./invariant.js";
import { loadRouteModule } from "./routeModules.js";
import { prefetchRouteCss, prefetchStyleLinks } from "./links.js";
import { RemixRootDefaultErrorBoundary } from "./errorBoundaries.js";
import { RemixRootDefaultHydrateFallback } from "./fallback.js";
import * as React$1 from "react";
//#region lib/dom/ssr/routes.tsx
function groupRoutesByParentId(manifest) {
	let routes = {};
	Object.values(manifest).forEach((route) => {
		if (route) {
			let parentId = route.parentId || "";
			if (!routes[parentId]) routes[parentId] = [];
			routes[parentId].push(route);
		}
	});
	return routes;
}
function getRouteComponents(route, routeModule, isSpaMode) {
	let Component = getRouteModuleComponent(routeModule);
	let HydrateFallback = routeModule.HydrateFallback && (!isSpaMode || route.id === "root") ? routeModule.HydrateFallback : route.id === "root" ? RemixRootDefaultHydrateFallback : void 0;
	let ErrorBoundary = routeModule.ErrorBoundary ? routeModule.ErrorBoundary : route.id === "root" ? () => /* @__PURE__ */ React$1.createElement(RemixRootDefaultErrorBoundary, { error: useRouteError() }) : void 0;
	if (route.id === "root" && routeModule.Layout) return {
		...Component ? { element: /* @__PURE__ */ React$1.createElement(routeModule.Layout, null, /* @__PURE__ */ React$1.createElement(Component, null)) } : { Component },
		...ErrorBoundary ? { errorElement: /* @__PURE__ */ React$1.createElement(routeModule.Layout, null, /* @__PURE__ */ React$1.createElement(ErrorBoundary, null)) } : { ErrorBoundary },
		...HydrateFallback ? { hydrateFallbackElement: /* @__PURE__ */ React$1.createElement(routeModule.Layout, null, /* @__PURE__ */ React$1.createElement(HydrateFallback, null)) } : { HydrateFallback }
	};
	return {
		Component,
		ErrorBoundary,
		HydrateFallback
	};
}
function createServerRoutes(manifest, routeModules, future, isSpaMode, parentId = "", routesByParentId = groupRoutesByParentId(manifest), spaModeLazyPromise = Promise.resolve({ Component: () => null })) {
	return (routesByParentId[parentId] || []).map((route) => {
		let routeModule = routeModules[route.id];
		invariant(routeModule, "No `routeModule` available to create server routes");
		let dataRoute = {
			...getRouteComponents(route, routeModule, isSpaMode),
			caseSensitive: route.caseSensitive,
			id: route.id,
			index: route.index,
			path: route.path,
			handle: routeModule.handle,
			lazy: isSpaMode ? () => spaModeLazyPromise : void 0,
			loader: route.hasLoader || route.hasClientLoader ? () => null : void 0
		};
		let children = createServerRoutes(manifest, routeModules, future, isSpaMode, route.id, routesByParentId, spaModeLazyPromise);
		if (children.length > 0) dataRoute.children = children;
		return dataRoute;
	});
}
function createClientRoutesWithHMRRevalidationOptOut(needsRevalidation, manifest, routeModulesCache, initialState, ssr, isSpaMode) {
	return createClientRoutes(manifest, routeModulesCache, initialState, ssr, isSpaMode, "", groupRoutesByParentId(manifest), needsRevalidation);
}
function preventInvalidServerHandlerCall(type, route) {
	if (type === "loader" && !route.hasLoader || type === "action" && !route.hasAction) {
		let msg = `You are trying to call ${type === "action" ? "serverAction()" : "serverLoader()"} on a route that does not have a server ${type} (routeId: "${route.id}")`;
		console.error(msg);
		throw new ErrorResponseImpl(400, "Bad Request", new Error(msg), true);
	}
}
function noActionDefinedError(type, routeId) {
	let article = type === "clientAction" ? "a" : "an";
	let msg = `Route "${routeId}" does not have ${article} ${type}, but you are trying to submit to it. To fix this, please add ${article} \`${type}\` function to the route`;
	console.error(msg);
	throw new ErrorResponseImpl(405, "Method Not Allowed", new Error(msg), true);
}
function createClientRoutes(manifest, routeModulesCache, initialState, ssr, isSpaMode, parentId = "", routesByParentId = groupRoutesByParentId(manifest), needsRevalidation) {
	return (routesByParentId[parentId] || []).map((route) => {
		let routeModule = routeModulesCache[route.id];
		function fetchServerHandler(singleFetch) {
			invariant(typeof singleFetch === "function", "No single fetch function available for route handler");
			return singleFetch();
		}
		function fetchServerLoader(singleFetch) {
			if (!route.hasLoader) return Promise.resolve(null);
			return fetchServerHandler(singleFetch);
		}
		function fetchServerAction(singleFetch) {
			if (!route.hasAction) throw noActionDefinedError("action", route.id);
			return fetchServerHandler(singleFetch);
		}
		function prefetchModule(modulePath) {
			import(
				/* @vite-ignore */
				/* webpackIgnore: true */
				modulePath
);
		}
		function prefetchRouteModuleChunks(route) {
			if (route.clientActionModule) prefetchModule(route.clientActionModule);
			if (route.clientLoaderModule) prefetchModule(route.clientLoaderModule);
		}
		async function prefetchStylesAndCallHandler(handler) {
			let cachedModule = routeModulesCache[route.id];
			let linkPrefetchPromise = cachedModule ? prefetchStyleLinks(route, cachedModule) : Promise.resolve();
			try {
				return handler();
			} finally {
				await linkPrefetchPromise;
			}
		}
		let dataRoute = {
			id: route.id,
			index: route.index,
			path: route.path
		};
		if (routeModule) {
			Object.assign(dataRoute, {
				...dataRoute,
				...getRouteComponents(route, routeModule, isSpaMode),
				middleware: routeModule.clientMiddleware,
				handle: routeModule.handle,
				shouldRevalidate: getShouldRevalidateFunction(dataRoute.path, routeModule, route, ssr, needsRevalidation)
			});
			let hasInitialData = initialState && initialState.loaderData && route.id in initialState.loaderData;
			let initialData = hasInitialData ? initialState?.loaderData?.[route.id] : void 0;
			let hasInitialError = initialState && initialState.errors && route.id in initialState.errors;
			let initialError = hasInitialError ? initialState?.errors?.[route.id] : void 0;
			let isHydrationRequest = needsRevalidation == null && (routeModule.clientLoader?.hydrate === true || !route.hasLoader);
			dataRoute.loader = async ({ request, params, context, pattern, url }, singleFetch) => {
				let _isHydrationRequest = isHydrationRequest;
				isHydrationRequest = false;
				return await prefetchStylesAndCallHandler(async () => {
					invariant(routeModule, "No `routeModule` available for critical-route loader");
					if (!routeModule.clientLoader) return fetchServerLoader(singleFetch);
					return routeModule.clientLoader({
						request,
						params,
						context,
						pattern,
						url,
						async serverLoader() {
							preventInvalidServerHandlerCall("loader", route);
							if (_isHydrationRequest) {
								if (hasInitialData) return initialData;
								if (hasInitialError) throw initialError;
							}
							return fetchServerLoader(singleFetch);
						}
					});
				});
			};
			dataRoute.loader.hydrate = shouldHydrateRouteLoader(route.id, routeModule.clientLoader, route.hasLoader, isSpaMode);
			dataRoute.action = ({ request, params, context, pattern, url }, singleFetch) => {
				return prefetchStylesAndCallHandler(async () => {
					invariant(routeModule, "No `routeModule` available for critical-route action");
					if (!routeModule.clientAction) {
						if (isSpaMode) throw noActionDefinedError("clientAction", route.id);
						return fetchServerAction(singleFetch);
					}
					return routeModule.clientAction({
						request,
						params,
						context,
						pattern,
						url,
						async serverAction() {
							preventInvalidServerHandlerCall("action", route);
							return fetchServerAction(singleFetch);
						}
					});
				});
			};
		} else {
			if (!route.hasClientLoader) dataRoute.loader = (_, singleFetch) => prefetchStylesAndCallHandler(() => {
				return fetchServerLoader(singleFetch);
			});
			if (!route.hasClientAction) dataRoute.action = (_, singleFetch) => prefetchStylesAndCallHandler(() => {
				if (isSpaMode) throw noActionDefinedError("clientAction", route.id);
				return fetchServerAction(singleFetch);
			});
			let lazyRoutePromise;
			async function getLazyRoute() {
				if (lazyRoutePromise) return await lazyRoutePromise;
				lazyRoutePromise = (async () => {
					if (route.clientLoaderModule || route.clientActionModule) await new Promise((resolve) => setTimeout(resolve, 0));
					let routeModulePromise = loadRouteModuleWithBlockingLinks(route, routeModulesCache);
					prefetchRouteModuleChunks(route);
					return await routeModulePromise;
				})();
				return await lazyRoutePromise;
			}
			dataRoute.lazy = {
				loader: route.hasClientLoader ? async () => {
					let { clientLoader } = route.clientLoaderModule ? await import(
						/* @vite-ignore */
						/* webpackIgnore: true */
						route.clientLoaderModule
) : await getLazyRoute();
					invariant(clientLoader, "No `clientLoader` export found");
					return (args, singleFetch) => clientLoader({
						...args,
						async serverLoader() {
							preventInvalidServerHandlerCall("loader", route);
							return fetchServerLoader(singleFetch);
						}
					});
				} : void 0,
				action: route.hasClientAction ? async () => {
					let clientActionPromise = route.clientActionModule ? import(
						/* @vite-ignore */
						/* webpackIgnore: true */
						route.clientActionModule
) : getLazyRoute();
					prefetchRouteModuleChunks(route);
					let { clientAction } = await clientActionPromise;
					invariant(clientAction, "No `clientAction` export found");
					return (args, singleFetch) => clientAction({
						...args,
						async serverAction() {
							preventInvalidServerHandlerCall("action", route);
							return fetchServerAction(singleFetch);
						}
					});
				} : void 0,
				middleware: route.hasClientMiddleware ? async () => {
					let { clientMiddleware } = route.clientMiddlewareModule ? await import(
						/* @vite-ignore */
						/* webpackIgnore: true */
						route.clientMiddlewareModule
) : await getLazyRoute();
					invariant(clientMiddleware, "No `clientMiddleware` export found");
					return clientMiddleware;
				} : void 0,
				shouldRevalidate: async () => {
					let lazyRoute = await getLazyRoute();
					return getShouldRevalidateFunction(dataRoute.path, lazyRoute, route, ssr, needsRevalidation);
				},
				handle: async () => (await getLazyRoute()).handle,
				Component: async () => (await getLazyRoute()).Component,
				ErrorBoundary: route.hasErrorBoundary ? async () => (await getLazyRoute()).ErrorBoundary : void 0
			};
		}
		let children = createClientRoutes(manifest, routeModulesCache, initialState, ssr, isSpaMode, route.id, routesByParentId, needsRevalidation);
		if (children.length > 0) dataRoute.children = children;
		return dataRoute;
	});
}
function getShouldRevalidateFunction(path, route, manifestRoute, ssr, needsRevalidation) {
	if (needsRevalidation) return wrapShouldRevalidateForHdr(manifestRoute.id, route.shouldRevalidate, needsRevalidation);
	if (!ssr && manifestRoute.hasLoader && !manifestRoute.hasClientLoader) {
		let myParams = path ? compilePath(path)[1].map((p) => p.paramName) : [];
		const didParamsChange = (opts) => myParams.some((p) => opts.currentParams[p] !== opts.nextParams[p]);
		if (route.shouldRevalidate) {
			let fn = route.shouldRevalidate;
			return (opts) => fn({
				...opts,
				defaultShouldRevalidate: didParamsChange(opts)
			});
		} else return (opts) => didParamsChange(opts);
	}
	return route.shouldRevalidate;
}
function wrapShouldRevalidateForHdr(routeId, routeShouldRevalidate, needsRevalidation) {
	let handledRevalidation = false;
	return (arg) => {
		if (!handledRevalidation) {
			handledRevalidation = true;
			return needsRevalidation.has(routeId);
		}
		return routeShouldRevalidate ? routeShouldRevalidate(arg) : arg.defaultShouldRevalidate;
	};
}
async function loadRouteModuleWithBlockingLinks(route, routeModules) {
	let routeModulePromise = loadRouteModule(route, routeModules);
	let prefetchRouteCssPromise = prefetchRouteCss(route);
	let routeModule = await routeModulePromise;
	await Promise.all([prefetchRouteCssPromise, prefetchStyleLinks(route, routeModule)]);
	return {
		Component: getRouteModuleComponent(routeModule),
		ErrorBoundary: routeModule.ErrorBoundary,
		clientMiddleware: routeModule.clientMiddleware,
		clientAction: routeModule.clientAction,
		clientLoader: routeModule.clientLoader,
		handle: routeModule.handle,
		links: routeModule.links,
		meta: routeModule.meta,
		shouldRevalidate: routeModule.shouldRevalidate
	};
}
function getRouteModuleComponent(routeModule) {
	if (routeModule.default == null) return void 0;
	if (!(typeof routeModule.default === "object" && Object.keys(routeModule.default).length === 0)) return routeModule.default;
}
function shouldHydrateRouteLoader(routeId, clientLoader, hasLoader, isSpaMode) {
	return isSpaMode && routeId !== "root" || clientLoader != null && (clientLoader.hydrate === true || hasLoader !== true);
}
//#endregion
export { createClientRoutes, createClientRoutesWithHMRRevalidationOptOut, createServerRoutes, noActionDefinedError, shouldHydrateRouteLoader };
