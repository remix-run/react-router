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
import { ErrorResponseImpl, RouterContextProvider, createDataFunctionUrl, defaultMapRouteProperties, getRoutePattern, isRouteErrorResponse, removeTrailingSlash, stripBasename } from "../router/utils.js";
import { instrumentHandler, instrumentationResultMetaContext } from "../router/instrumentation.js";
import { createStaticHandler, getStaticContextFromError, isMutationMethod, isRedirectResponse, isResponse } from "../router/router.js";
import { getManifestPath } from "../dom/ssr/fog-of-war.js";
import { createEntryRouteModules } from "./entry.js";
import { isServerMode } from "./mode.js";
import { sanitizeErrors, serializeError } from "./errors.js";
import { matchServerRoutes } from "./routeMatching.js";
import { getBuildTimeHeader, getDevServerHooks } from "./dev.js";
import { createStaticHandlerDataRoutes } from "./routes.js";
import { createServerHandoffString } from "./serverHandoff.js";
import { getDocumentHeaders } from "./headers.js";
import { throwIfPotentialCSRFAttack } from "../actions.js";
import { getNormalizedPath } from "./urls.js";
import { SERVER_NO_BODY_STATUS_CODES, encodeViaTurboStream, generateSingleFetchRedirectResponse, singleFetchAction, singleFetchLoaders } from "./single-fetch.js";
//#region lib/server-runtime/server.ts
function derive(build, mode) {
	let dataRoutes = createStaticHandlerDataRoutes(build.routes);
	let serverMode = isServerMode(mode) ? mode : "production";
	let staticHandler = createStaticHandler(dataRoutes, {
		basename: build.basename,
		mapRouteProperties: defaultMapRouteProperties,
		instrumentations: build.entry.module.instrumentations,
		future: build.future
	});
	let errorHandler = build.entry.module.handleError || ((error, { request }) => {
		if (serverMode !== "test" && !request.signal.aborted) console.error(isRouteErrorResponse(error) && error.error ? error.error : error);
	});
	let requestHandlerInstrumentations = build.entry.module.instrumentations?.map((i) => i.handler).filter(Boolean);
	let requestHandler = async (request, initialContext) => {
		let params = {};
		let loadContext;
		let handleError = (error) => {
			if (mode === "development") getDevServerHooks()?.processRequestError?.(error);
			errorHandler(error, {
				context: loadContext,
				params,
				request
			});
		};
		if (initialContext && !(initialContext instanceof RouterContextProvider)) {
			let error = /* @__PURE__ */ new Error("Invalid `context` value provided to `handleRequest`. You must return an instance of `RouterContextProvider` from your `getLoadContext` function.");
			handleError(error);
			return returnLastResortErrorResponse(error, serverMode);
		}
		loadContext = initialContext || new RouterContextProvider();
		let requestUrl = new URL(request.url);
		let normalizedPath = getNormalizedPath(request);
		let normalizedPathname = normalizedPath.pathname;
		let isSpaMode = getBuildTimeHeader(request, "X-React-Router-SPA-Mode") === "yes";
		if (!build.ssr) {
			let decodedPath = decodeURI(normalizedPathname);
			if (build.basename && build.basename !== "/") {
				let strippedPath = stripBasename(decodedPath, build.basename);
				if (strippedPath == null) {
					errorHandler(new ErrorResponseImpl(404, "Not Found", `Refusing to prerender the \`${decodedPath}\` path because it does not start with the basename \`${build.basename}\``), {
						context: loadContext,
						params,
						request
					});
					return new Response("Not Found", {
						status: 404,
						statusText: "Not Found"
					});
				}
				decodedPath = strippedPath;
			}
			if (build.prerender.length === 0) isSpaMode = true;
			else if (!build.prerender.some((p) => removeTrailingSlash(p) === removeTrailingSlash(decodedPath))) if (requestUrl.pathname.endsWith(".data")) {
				errorHandler(new ErrorResponseImpl(404, "Not Found", `Refusing to SSR the path \`${decodedPath}\` because \`ssr:false\` is set and the path is not included in the \`prerender\` config, so in production the path will be a 404.`), {
					context: loadContext,
					params,
					request
				});
				return new Response("Not Found", {
					status: 404,
					statusText: "Not Found"
				});
			} else isSpaMode = true;
		}
		let manifestUrl = getManifestPath(build.routeDiscovery.manifestPath, build.basename);
		if (build.routeDiscovery.mode === "lazy" && requestUrl.pathname === manifestUrl) try {
			return await handleManifestRequest(build, staticHandler.dataRoutes, staticHandler._internalRouteBranches, requestUrl);
		} catch (e) {
			handleError(e);
			return new Response("Unknown Server Error", { status: 500 });
		}
		let matches = matchServerRoutes(build.routes, staticHandler.dataRoutes, staticHandler._internalRouteBranches, normalizedPathname, build.basename);
		if (matches && matches.length > 0) Object.assign(params, matches[0].params);
		if (requestHandlerInstrumentations?.length) loadContext.set(instrumentationResultMetaContext, {
			url: createDataFunctionUrl(request, normalizedPath),
			pattern: matches ? getRoutePattern(matches) : "",
			params: matches?.[0]?.params ? { ...matches[0].params } : {}
		});
		let response;
		if (requestUrl.pathname.endsWith(".data")) {
			response = await handleSingleFetchRequest(serverMode, build, staticHandler, request, loadContext, handleError);
			if (isRedirectResponse(response)) response = generateSingleFetchRedirectResponse(response, request, build, serverMode);
			if (build.entry.module.handleDataRequest) {
				response = await build.entry.module.handleDataRequest(response, {
					context: loadContext,
					params: matches ? matches[0].params : {},
					request
				});
				if (isRedirectResponse(response)) response = generateSingleFetchRedirectResponse(response, request, build, serverMode);
			}
		} else if (!isSpaMode && matches && matches[matches.length - 1].route.module.default == null && matches[matches.length - 1].route.module.ErrorBoundary == null) response = await handleResourceRequest(serverMode, build, staticHandler, matches.slice(-1)[0].route.id, request, loadContext, handleError);
		else {
			let { pathname } = requestUrl;
			let criticalCss = void 0;
			if (build.unstable_getCriticalCss) criticalCss = await build.unstable_getCriticalCss({ pathname });
			else if (mode === "development" && getDevServerHooks()?.getCriticalCss) criticalCss = await getDevServerHooks()?.getCriticalCss?.(pathname);
			response = await handleDocumentRequest(serverMode, build, staticHandler, request, loadContext, handleError, isSpaMode, criticalCss);
		}
		if (request.method === "HEAD") return new Response(null, {
			headers: response.headers,
			status: response.status,
			statusText: response.statusText
		});
		return response;
	};
	if (requestHandlerInstrumentations?.length) requestHandler = instrumentHandler(requestHandler, requestHandlerInstrumentations);
	return {
		serverMode,
		staticHandler,
		errorHandler,
		requestHandler
	};
}
/**
* Creates a request handler for a React Router server build.
*
* This is a low-level API used by server adapters to translate incoming
* requests into React Router responses.
*
* @category Utils
* @param build The server build, or a function that resolves to the server
* build, used to handle requests.
* @param mode The mode in which the server build is running.
* @returns A request handler that returns a response for each incoming request.
*/
const createRequestHandler = (build, mode) => {
	let _build;
	let serverMode;
	let staticHandler;
	let errorHandler;
	let _requestHandler;
	return async function requestHandler(request, initialContext) {
		_build = typeof build === "function" ? await build() : build;
		if (typeof build === "function") {
			let derived = derive(_build, mode);
			serverMode = derived.serverMode;
			staticHandler = derived.staticHandler;
			errorHandler = derived.errorHandler;
			_requestHandler = derived.requestHandler;
		} else if (!serverMode || !staticHandler || !errorHandler || !_requestHandler) {
			let derived = derive(_build, mode);
			serverMode = derived.serverMode;
			staticHandler = derived.staticHandler;
			errorHandler = derived.errorHandler;
			_requestHandler = derived.requestHandler;
		}
		return _requestHandler(request, initialContext);
	};
};
async function handleManifestRequest(build, dataRoutes, branches, url) {
	if (url.toString().length > 7680) return new Response(null, {
		statusText: "Bad Request",
		status: 400
	});
	if (build.assets.version !== url.searchParams.get("version")) return new Response(null, {
		status: 204,
		headers: { "X-Remix-Reload-Document": "true" }
	});
	let patches = {};
	if (url.searchParams.has("paths")) {
		let pathParam = url.searchParams.get("paths") || "";
		let paths = new Set(pathParam.split(",").filter(Boolean));
		for (let path of paths) {
			if (!path.startsWith("/")) path = `/${path}`;
			let matches = matchServerRoutes(build.routes, dataRoutes, branches, path, build.basename);
			if (matches) for (let match of matches) {
				let routeId = match.route.id;
				let route = build.assets.routes[routeId];
				if (route) patches[routeId] = route;
			}
		}
		return Response.json(patches, { headers: { "Cache-Control": "public, max-age=31536000, immutable" } });
	}
	return new Response("Invalid Request", { status: 400 });
}
async function handleSingleFetchRequest(serverMode, build, staticHandler, request, loadContext, handleError) {
	return isMutationMethod(request.method) ? await singleFetchAction(build, serverMode, staticHandler, request, loadContext, handleError) : await singleFetchLoaders(build, serverMode, staticHandler, request, loadContext, handleError);
}
async function handleDocumentRequest(serverMode, build, staticHandler, request, loadContext, handleError, isSpaMode, criticalCss) {
	try {
		if (isMutationMethod(request.method)) try {
			throwIfPotentialCSRFAttack(request, Array.isArray(build.allowedActionOrigins) ? build.allowedActionOrigins : []);
		} catch (e) {
			handleError(e);
			return new Response("Bad Request", { status: 400 });
		}
		let result = await staticHandler.query(request, {
			requestContext: loadContext,
			generateMiddlewareResponse: async (query) => {
				try {
					let innerResult = await query(request);
					if (!isResponse(innerResult)) innerResult = await renderHtml(innerResult, isSpaMode);
					return innerResult;
				} catch (error) {
					handleError(error);
					return new Response(null, { status: 500 });
				}
			},
			normalizePath: (r) => getNormalizedPath(r)
		});
		if (!isResponse(result)) result = await renderHtml(result, isSpaMode);
		return result;
	} catch (error) {
		handleError(error);
		return new Response(null, { status: 500 });
	}
	async function renderHtml(context, isSpaMode) {
		let headers = getDocumentHeaders(context, build);
		if (SERVER_NO_BODY_STATUS_CODES.has(context.statusCode)) return new Response(null, {
			status: context.statusCode,
			headers
		});
		if (context.errors) {
			Object.values(context.errors).forEach((err) => {
				if (!isRouteErrorResponse(err) || err.error) handleError(err);
			});
			context.errors = sanitizeErrors(context.errors, serverMode);
		}
		let state = {
			loaderData: context.loaderData,
			actionData: context.actionData,
			errors: context.errors
		};
		let baseServerHandoff = {
			basename: build.basename,
			future: build.future,
			routeDiscovery: build.routeDiscovery,
			ssr: build.ssr,
			isSpaMode
		};
		let entryContext = {
			manifest: build.assets,
			branches: staticHandler._internalRouteBranches,
			routeModules: createEntryRouteModules(build.routes),
			staticHandlerContext: context,
			criticalCss,
			serverHandoffString: createServerHandoffString({
				...baseServerHandoff,
				criticalCss
			}),
			serverHandoffStream: encodeViaTurboStream(state, request.signal, build.entry.module.streamTimeout, serverMode),
			renderMeta: {},
			future: build.future,
			ssr: build.ssr,
			routeDiscovery: build.routeDiscovery,
			isSpaMode,
			serializeError: (err) => serializeError(err, serverMode)
		};
		let handleDocumentRequestFunction = build.entry.module.default;
		try {
			return await handleDocumentRequestFunction(request, context.statusCode, headers, entryContext, loadContext);
		} catch (error) {
			handleError(error);
			let errorForSecondRender = error;
			if (isResponse(error)) try {
				let data = await unwrapResponse(error);
				errorForSecondRender = new ErrorResponseImpl(error.status, error.statusText, data);
			} catch (e) {}
			context = getStaticContextFromError(staticHandler.dataRoutes, context, errorForSecondRender);
			if (context.errors) context.errors = sanitizeErrors(context.errors, serverMode);
			let state = {
				loaderData: context.loaderData,
				actionData: context.actionData,
				errors: context.errors
			};
			entryContext = {
				...entryContext,
				staticHandlerContext: context,
				serverHandoffString: createServerHandoffString(baseServerHandoff),
				serverHandoffStream: encodeViaTurboStream(state, request.signal, build.entry.module.streamTimeout, serverMode),
				renderMeta: {}
			};
			try {
				return await handleDocumentRequestFunction(request, context.statusCode, headers, entryContext, loadContext);
			} catch (error) {
				handleError(error);
				return returnLastResortErrorResponse(error, serverMode);
			}
		}
	}
}
async function handleResourceRequest(serverMode, build, staticHandler, routeId, request, loadContext, handleError) {
	try {
		return handleQueryRouteResult(await staticHandler.queryRoute(request, {
			routeId,
			requestContext: loadContext,
			generateMiddlewareResponse: async (queryRoute) => {
				try {
					return handleQueryRouteResult(await queryRoute(request));
				} catch (error) {
					return handleQueryRouteError(error);
				}
			},
			normalizePath: (r) => getNormalizedPath(r)
		}));
	} catch (error) {
		return handleQueryRouteError(error);
	}
	function handleQueryRouteResult(result) {
		if (isResponse(result)) return result;
		if (typeof result === "string") return new Response(result);
		return Response.json(result);
	}
	function handleQueryRouteError(error) {
		if (isResponse(error)) return error;
		if (isRouteErrorResponse(error)) {
			handleError(error);
			return errorResponseToJson(error, serverMode);
		}
		if (error instanceof Error && error.message === "Expected a response from queryRoute") {
			let newError = /* @__PURE__ */ new Error("Expected a Response to be returned from resource route handler");
			handleError(newError);
			return returnLastResortErrorResponse(newError, serverMode);
		}
		handleError(error);
		return returnLastResortErrorResponse(error, serverMode);
	}
}
function errorResponseToJson(errorResponse, serverMode) {
	return Response.json(serializeError(errorResponse.error || /* @__PURE__ */ new Error("Unexpected Server Error"), serverMode), {
		status: errorResponse.status,
		statusText: errorResponse.statusText
	});
}
function returnLastResortErrorResponse(error, serverMode) {
	let message = "Unexpected Server Error";
	if (serverMode !== "production") message += `\n\n${String(error)}`;
	return new Response(message, {
		status: 500,
		headers: { "Content-Type": "text/plain" }
	});
}
function unwrapResponse(response) {
	let contentType = response.headers.get("Content-Type");
	return contentType && /\bapplication\/json\b/.test(contentType) ? response.body == null ? null : response.json() : response.text();
}
//#endregion
export { createRequestHandler };
