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
import { ErrorResponseImpl, SUPPORTED_ERROR_TYPES, data, isRouteErrorResponse, redirect } from "../../router/utils.js";
import { isDataWithResponseInit, isResponse } from "../../router/router.js";
import invariant from "./invariant.js";
import { escapeHtml } from "./markup.js";
import { decode } from "../../../vendor/turbo-stream-v2/turbo-stream.js";
import { createRequestInit } from "./data.js";
import * as React$1 from "react";
//#region lib/dom/ssr/single-fetch.tsx
const SingleFetchRedirectSymbol = Symbol("SingleFetchRedirect");
var SingleFetchNoResultError = class extends Error {};
const NO_BODY_STATUS_CODES = new Set([
	100,
	101,
	204,
	205
]);
function StreamTransfer({ context, identifier, reader, textDecoder, nonce }) {
	if (!context.renderMeta || !context.renderMeta.didRenderScripts) return null;
	if (!context.renderMeta.streamCache) context.renderMeta.streamCache = {};
	let { streamCache } = context.renderMeta;
	let promise = streamCache[identifier];
	if (!promise) promise = streamCache[identifier] = reader.read().then((result) => {
		streamCache[identifier].result = {
			done: result.done,
			value: textDecoder.decode(result.value, { stream: true })
		};
	}).catch((e) => {
		streamCache[identifier].error = e;
	});
	if (promise.error) throw promise.error;
	if (promise.result === void 0) throw promise;
	let { done, value } = promise.result;
	let scriptTag = value ? /* @__PURE__ */ React$1.createElement("script", {
		nonce,
		dangerouslySetInnerHTML: { __html: `window.__reactRouterContext.streamController.enqueue(${escapeHtml(JSON.stringify(value))});` }
	}) : null;
	if (done) return /* @__PURE__ */ React$1.createElement(React$1.Fragment, null, scriptTag, /* @__PURE__ */ React$1.createElement("script", {
		nonce,
		dangerouslySetInnerHTML: { __html: `window.__reactRouterContext.streamController.close();` }
	}));
	else return /* @__PURE__ */ React$1.createElement(React$1.Fragment, null, scriptTag, /* @__PURE__ */ React$1.createElement(React$1.Suspense, null, /* @__PURE__ */ React$1.createElement(StreamTransfer, {
		context,
		identifier: identifier + 1,
		reader,
		textDecoder,
		nonce
	})));
}
function getTurboStreamSingleFetchDataStrategy(getRouter, manifest, routeModules, ssr) {
	let dataStrategy = getSingleFetchDataStrategyImpl(getRouter, (match) => {
		let manifestRoute = manifest.routes[match.route.id];
		invariant(manifestRoute, "Route not found in manifest");
		return {
			hasLoader: manifestRoute.hasLoader,
			hasClientLoader: manifestRoute.hasClientLoader
		};
	}, fetchAndDecodeViaTurboStream, ssr);
	return async (args) => args.runClientMiddleware(dataStrategy);
}
function getSingleFetchDataStrategyImpl(getRouter, getRouteInfo, fetchAndDecode, ssr, shouldAllowOptOut = () => true) {
	return async (args) => {
		let { request, matches, fetcherKey } = args;
		let router = getRouter();
		if (request.method !== "GET") return singleFetchActionStrategy(args, fetchAndDecode);
		let foundRevalidatingServerLoader = matches.some((m) => {
			let { hasLoader, hasClientLoader } = getRouteInfo(m);
			return m.shouldCallHandler() && hasLoader && !hasClientLoader;
		});
		if (!ssr && !foundRevalidatingServerLoader) return nonSsrStrategy(args, getRouteInfo, fetchAndDecode);
		if (fetcherKey) return singleFetchLoaderFetcherStrategy(args, fetchAndDecode);
		return singleFetchLoaderNavigationStrategy(args, router, getRouteInfo, fetchAndDecode, ssr, shouldAllowOptOut);
	};
}
async function singleFetchActionStrategy(args, fetchAndDecode) {
	let actionMatch = args.matches.find((m) => m.shouldCallHandler());
	invariant(actionMatch, "No action match found");
	let actionStatus = void 0;
	let result = await actionMatch.resolve(async (handler) => {
		return await handler(async () => {
			let { data, status } = await fetchAndDecode(args, [actionMatch.route.id]);
			actionStatus = status;
			return unwrapSingleFetchResult(data, actionMatch.route.id);
		});
	});
	if (isResponse(result.result) || isRouteErrorResponse(result.result) || isDataWithResponseInit(result.result)) return { [actionMatch.route.id]: result };
	return { [actionMatch.route.id]: {
		type: result.type,
		result: data(result.result, actionStatus)
	} };
}
async function nonSsrStrategy(args, getRouteInfo, fetchAndDecode) {
	let matchesToLoad = args.matches.filter((m) => m.shouldCallHandler());
	let results = {};
	await Promise.all(matchesToLoad.map((m) => m.resolve(async (handler) => {
		try {
			let { hasClientLoader } = getRouteInfo(m);
			let routeId = m.route.id;
			let result = hasClientLoader ? await handler(async () => {
				let { data } = await fetchAndDecode(args, [routeId]);
				return unwrapSingleFetchResult(data, routeId);
			}) : await handler();
			results[m.route.id] = {
				type: "data",
				result
			};
		} catch (e) {
			results[m.route.id] = {
				type: "error",
				result: e
			};
		}
	})));
	return results;
}
async function singleFetchLoaderNavigationStrategy(args, router, getRouteInfo, fetchAndDecode, ssr, shouldAllowOptOut = () => true) {
	let routesParams = /* @__PURE__ */ new Set();
	let foundOptOutRoute = false;
	let routeDfds = args.matches.map(() => createDeferred());
	let singleFetchDfd = createDeferred();
	let results = {};
	let resolvePromise = Promise.all(args.matches.map(async (m, i) => m.resolve(async (handler) => {
		routeDfds[i].resolve();
		let routeId = m.route.id;
		let { hasLoader, hasClientLoader } = getRouteInfo(m);
		let defaultShouldRevalidate = !m.shouldRevalidateArgs || m.shouldRevalidateArgs.actionStatus == null || m.shouldRevalidateArgs.actionStatus < 400;
		if (!m.shouldCallHandler(defaultShouldRevalidate)) {
			foundOptOutRoute ||= m.shouldRevalidateArgs != null && hasLoader;
			return;
		}
		if (shouldAllowOptOut(m) && hasClientLoader) {
			if (hasLoader) foundOptOutRoute = true;
			try {
				results[routeId] = {
					type: "data",
					result: await handler(async () => {
						let { data } = await fetchAndDecode(args, [routeId]);
						return unwrapSingleFetchResult(data, routeId);
					})
				};
			} catch (e) {
				results[routeId] = {
					type: "error",
					result: e
				};
			}
			return;
		}
		if (hasLoader) routesParams.add(routeId);
		try {
			results[routeId] = {
				type: "data",
				result: await handler(async () => {
					return unwrapSingleFetchResult(await singleFetchDfd.promise, routeId);
				})
			};
		} catch (e) {
			results[routeId] = {
				type: "error",
				result: e
			};
		}
	})));
	await Promise.all(routeDfds.map((d) => d.promise));
	if ((!router.state.initialized && router.state.navigation.state === "idle" || routesParams.size === 0) && !window.__reactRouterHdrActive) singleFetchDfd.resolve({ routes: {} });
	else {
		let targetRoutes = ssr && foundOptOutRoute && routesParams.size > 0 ? [...routesParams.keys()] : void 0;
		try {
			let data = await fetchAndDecode(args, targetRoutes);
			singleFetchDfd.resolve(data.data);
		} catch (e) {
			singleFetchDfd.reject(e);
		}
	}
	await resolvePromise;
	await bubbleMiddlewareErrors(singleFetchDfd.promise, args.matches, routesParams, results);
	return results;
}
async function bubbleMiddlewareErrors(singleFetchPromise, matches, routesParams, results) {
	try {
		let middlewareError;
		let fetchedData = await singleFetchPromise;
		if ("routes" in fetchedData) {
			for (let match of matches) if (match.route.id in fetchedData.routes) {
				let routeResult = fetchedData.routes[match.route.id];
				if ("error" in routeResult) {
					middlewareError = routeResult.error;
					if (results[match.route.id]?.result == null) results[match.route.id] = {
						type: "error",
						result: middlewareError
					};
					break;
				}
			}
		}
		if (middlewareError !== void 0) Array.from(routesParams.values()).forEach((routeId) => {
			if (results[routeId].result instanceof SingleFetchNoResultError) results[routeId].result = middlewareError;
		});
	} catch (e) {}
}
async function singleFetchLoaderFetcherStrategy(args, fetchAndDecode) {
	let fetcherMatch = args.matches.find((m) => m.shouldCallHandler());
	invariant(fetcherMatch, "No fetcher match found");
	let routeId = fetcherMatch.route.id;
	let result = await fetcherMatch.resolve(async (handler) => handler(async () => {
		let { data } = await fetchAndDecode(args, [routeId]);
		return unwrapSingleFetchResult(data, routeId);
	}));
	return { [fetcherMatch.route.id]: result };
}
function stripIndexParam(url) {
	let indexValues = url.searchParams.getAll("index");
	url.searchParams.delete("index");
	let indexValuesToKeep = [];
	for (let indexValue of indexValues) if (indexValue) indexValuesToKeep.push(indexValue);
	for (let toKeep of indexValuesToKeep) url.searchParams.append("index", toKeep);
	return url;
}
function singleFetchUrl(reqUrl, extension) {
	let url = typeof reqUrl === "string" ? new URL(reqUrl, typeof window === "undefined" ? "server://singlefetch/" : window.location.origin) : reqUrl;
	if (url.pathname.endsWith("/")) url.pathname = `${url.pathname}_.${extension}`;
	else url.pathname = `${url.pathname}.${extension}`;
	return url;
}
async function fetchAndDecodeViaTurboStream(args, targetRoutes) {
	let { request } = args;
	let url = singleFetchUrl(request.url, "data");
	if (request.method === "GET") {
		url = stripIndexParam(url);
		if (targetRoutes) url.searchParams.set("_routes", targetRoutes.join(","));
	}
	let res = await fetch(url, await createRequestInit(request));
	if (res.status >= 400 && !res.headers.has("X-Remix-Response")) throw new ErrorResponseImpl(res.status, res.statusText, await res.text());
	if (res.status === 204 && res.headers.has("X-Remix-Redirect")) return {
		status: 202,
		data: { redirect: {
			redirect: res.headers.get("X-Remix-Redirect"),
			status: Number(res.headers.get("X-Remix-Status") || "302"),
			revalidate: res.headers.get("X-Remix-Revalidate") === "true",
			reload: res.headers.get("X-Remix-Reload-Document") === "true",
			replace: res.headers.get("X-Remix-Replace") === "true"
		} }
	};
	if (NO_BODY_STATUS_CODES.has(res.status)) {
		let routes = {};
		if (targetRoutes && request.method !== "GET") routes[targetRoutes[0]] = { data: void 0 };
		return {
			status: res.status,
			data: { routes }
		};
	}
	invariant(res.body, "No response body to decode");
	try {
		let decoded = await decodeViaTurboStream(res.body, window);
		let data;
		if (request.method === "GET") {
			let typed = decoded.value;
			if (SingleFetchRedirectSymbol in typed) data = { redirect: typed[SingleFetchRedirectSymbol] };
			else data = { routes: typed };
		} else {
			let typed = decoded.value;
			let routeId = targetRoutes?.[0];
			invariant(routeId, "No routeId found for single fetch call decoding");
			if ("redirect" in typed) data = { redirect: typed };
			else data = { routes: { [routeId]: typed } };
		}
		return {
			status: res.status,
			data
		};
	} catch (e) {
		throw new Error("Unable to decode turbo-stream response");
	}
}
function decodeViaTurboStream(body, global) {
	return decode(body, { plugins: [(type, ...rest) => {
		if (type === "SanitizedError") {
			let [name, message, stack] = rest;
			let Constructor = Error;
			if (name && SUPPORTED_ERROR_TYPES.includes(name) && name in global && typeof global[name] === "function") Constructor = global[name];
			let error = new Constructor(message);
			error.stack = stack;
			return { value: error };
		}
		if (type === "ErrorResponse") {
			let [data, status, statusText] = rest;
			return { value: new ErrorResponseImpl(status, statusText, data) };
		}
		if (type === "SingleFetchRedirect") return { value: { [SingleFetchRedirectSymbol]: rest[0] } };
		if (type === "SingleFetchClassInstance") return { value: rest[0] };
		if (type === "SingleFetchFallback") return { value: void 0 };
	}] });
}
function unwrapSingleFetchResult(result, routeId) {
	if ("redirect" in result) {
		let { redirect: location, revalidate, reload, replace, status } = result.redirect;
		throw redirect(location, {
			status,
			headers: {
				...revalidate ? { "X-Remix-Revalidate": "yes" } : null,
				...reload ? { "X-Remix-Reload-Document": "yes" } : null,
				...replace ? { "X-Remix-Replace": "yes" } : null
			}
		});
	}
	let routeResult = result.routes[routeId];
	if (routeResult == null) throw new SingleFetchNoResultError(`No result found for routeId "${routeId}"`);
	else if ("error" in routeResult) throw routeResult.error;
	else if ("data" in routeResult) return routeResult.data;
	else throw new Error(`Invalid response found for routeId "${routeId}"`);
}
function createDeferred() {
	let resolve;
	let reject;
	let promise = new Promise((res, rej) => {
		resolve = async (val) => {
			res(val);
			try {
				await promise;
			} catch (e) {}
		};
		reject = async (error) => {
			rej(error);
			try {
				await promise;
			} catch (e) {}
		};
	});
	return {
		promise,
		resolve,
		reject
	};
}
//#endregion
export { NO_BODY_STATUS_CODES, SingleFetchRedirectSymbol, StreamTransfer, decodeViaTurboStream, getSingleFetchDataStrategyImpl, getTurboStreamSingleFetchDataStrategy, singleFetchUrl, stripIndexParam };
