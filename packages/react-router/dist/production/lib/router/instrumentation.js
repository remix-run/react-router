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
import { createPath, invariant } from "./history.js";
import { RouterContextProvider, createContext } from "./utils.js";
//#region lib/router/instrumentation.ts
const UninstrumentedSymbol = Symbol("Uninstrumented");
const instrumentationResultMetaContext = createContext();
let instrumentationClientResultMetaReceivers = /* @__PURE__ */ new WeakMap();
function getRouteInstrumentationUpdates(fns, route) {
	let aggregated = {
		lazy: [],
		"lazy.loader": [],
		"lazy.action": [],
		"lazy.middleware": [],
		middleware: [],
		loader: [],
		action: []
	};
	fns.forEach((fn) => fn({
		id: route.id,
		index: route.index,
		path: route.path,
		instrument(i) {
			if (i.lazy != null) aggregated.lazy.push(i.lazy);
			if (i["lazy.loader"] != null) aggregated["lazy.loader"].push(i["lazy.loader"]);
			if (i["lazy.action"] != null) aggregated["lazy.action"].push(i["lazy.action"]);
			if (i["lazy.middleware"] != null) aggregated["lazy.middleware"].push(i["lazy.middleware"]);
			if (i.middleware != null) aggregated.middleware.push(i.middleware);
			if (i.loader != null) aggregated.loader.push(i.loader);
			if (i.action != null) aggregated.action.push(i.action);
		}
	}));
	let updates = {};
	if (typeof route.lazy === "function" && aggregated.lazy.length > 0) {
		let lazy = route.lazy;
		updates.lazy = async (...args) => {
			return throwOrReturnResult(await recurseRight(aggregated.lazy, void 0, () => lazy(...args), getInstrumentationInnerResult));
		};
	}
	if (typeof route.lazy === "object") {
		let lazyObject = route.lazy;
		if (typeof lazyObject.middleware === "function" && aggregated["lazy.middleware"].length > 0) {
			let middleware = lazyObject.middleware;
			updates.lazy = Object.assign(updates.lazy || {}, { middleware: async (...args) => {
				return throwOrReturnResult(await recurseRight(aggregated["lazy.middleware"], void 0, () => middleware(...args), getInstrumentationInnerResult));
			} });
		}
		if (typeof lazyObject.loader === "function" && aggregated["lazy.loader"].length > 0) {
			let loader = lazyObject.loader;
			updates.lazy = Object.assign(updates.lazy || {}, { loader: async (...args) => {
				return throwOrReturnResult(await recurseRight(aggregated["lazy.loader"], void 0, () => loader(...args), getInstrumentationInnerResult));
			} });
		}
		if (typeof lazyObject.action === "function" && aggregated["lazy.action"].length > 0) {
			let action = lazyObject.action;
			updates.lazy = Object.assign(updates.lazy || {}, { action: async (...args) => {
				return throwOrReturnResult(await recurseRight(aggregated["lazy.action"], void 0, () => action(...args), getInstrumentationInnerResult));
			} });
		}
	}
	if (typeof route.loader === "function" && aggregated.loader.length > 0) {
		let original = getUninstrumentedHandler(route.loader);
		let instrumented = async (...args) => {
			return throwOrReturnResult(await recurseRight(aggregated.loader, getHandlerInfo(args[0]), () => original(...args), getInstrumentationInnerResult));
		};
		if (original.hydrate === true) instrumented.hydrate = true;
		setUninstrumentedHandler(instrumented, original);
		updates.loader = instrumented;
	}
	if (typeof route.action === "function" && aggregated.action.length > 0) {
		let original = getUninstrumentedHandler(route.action);
		let instrumented = async (...args) => {
			return throwOrReturnResult(await recurseRight(aggregated.action, getHandlerInfo(args[0]), () => original(...args), getInstrumentationInnerResult));
		};
		setUninstrumentedHandler(instrumented, original);
		updates.action = instrumented;
	}
	if (route.middleware && route.middleware.length > 0 && aggregated.middleware.length > 0) updates.middleware = route.middleware.map((middleware) => {
		let original = getUninstrumentedHandler(middleware);
		let instrumented = async (...args) => {
			return throwOrReturnResult(await recurseRight(aggregated.middleware, getHandlerInfo(args[0]), () => original(...args), getInstrumentationInnerResult));
		};
		setUninstrumentedHandler(instrumented, original);
		return instrumented;
	});
	return updates;
}
function instrumentClientSideRouter(router, fns) {
	let aggregated = {
		navigate: [],
		fetch: []
	};
	fns.forEach((fn) => fn({ instrument(i) {
		if (i.navigate != null) aggregated.navigate.push(i.navigate);
		if (i.fetch != null) aggregated.fetch.push(i.fetch);
	} }));
	if (aggregated.navigate.length > 0) {
		let navigate = getUninstrumentedHandler(router.navigate);
		let instrumentedNavigate = async (...args) => {
			let [to, opts] = args;
			let meta;
			let info = {
				to: typeof to === "number" || typeof to === "string" ? to : to ? createPath(to) : ".",
				...getRouterInfo(router, opts ?? {})
			};
			return throwOrReturnResult(await recurseRight(aggregated.navigate, info, async () => {
				if (typeof to === "number") return await navigate(...args);
				let cleanup = setInstrumentationClientResultMetaReceiver(router, (value) => {
					meta = value;
				});
				try {
					return await navigate(...args);
				} finally {
					cleanup();
				}
			}, (result) => ({
				...getInstrumentationInnerResult(result),
				meta
			})));
		};
		setUninstrumentedHandler(instrumentedNavigate, navigate);
		router.navigate = instrumentedNavigate;
	}
	if (aggregated.fetch.length > 0) {
		let fetch = getUninstrumentedHandler(router.fetch);
		let instrumentedFetch = async (...args) => {
			let [key, _, href, opts] = args;
			let meta;
			return throwOrReturnResult(await recurseRight(aggregated.fetch, {
				href: href ?? ".",
				fetcherKey: key,
				...getRouterInfo(router, opts ?? {})
			}, async () => {
				let cleanup = setInstrumentationClientResultMetaReceiver(router, (value) => {
					meta = value;
				});
				try {
					return await fetch(...args);
				} finally {
					cleanup();
				}
			}, (result) => ({
				...getInstrumentationInnerResult(result),
				meta
			})));
		};
		setUninstrumentedHandler(instrumentedFetch, fetch);
		router.fetch = instrumentedFetch;
	}
	return router;
}
function instrumentHandler(handler, fns) {
	let aggregated = { request: [] };
	fns.forEach((fn) => fn({ instrument(i) {
		if (i.request != null) aggregated.request.push(i.request);
	} }));
	let instrumentedHandler = handler;
	if (aggregated.request.length > 0) instrumentedHandler = async (...args) => {
		let [request, context] = args;
		let instrumentationContext = context ?? new RouterContextProvider();
		return throwOrReturnResult(await recurseRight(aggregated.request, {
			request: getReadonlyRequest(request),
			context: getReadonlyContext(instrumentationContext)
		}, () => handler(request, instrumentationContext), (result, info) => {
			let meta;
			try {
				meta = info.context?.get(instrumentationResultMetaContext);
			} catch {}
			invariant(result.value instanceof Response, "Expected a Response from the request handler");
			return {
				...getInstrumentationInnerResult(result),
				statusCode: result.value.status,
				meta
			};
		}));
	};
	return instrumentedHandler;
}
function getUninstrumentedHandler(handler) {
	return handler[UninstrumentedSymbol] ?? handler;
}
function setUninstrumentedHandler(handler, uninstrumentedHandler) {
	handler[UninstrumentedSymbol] = uninstrumentedHandler;
}
function setInstrumentationClientResultMetaReceiver(router, receiver) {
	instrumentationClientResultMetaReceivers.set(router, receiver);
	return () => {
		if (instrumentationClientResultMetaReceivers.get(router) === receiver) instrumentationClientResultMetaReceivers.delete(router);
	};
}
function consumeInstrumentationClientResultMetaReceiver(router) {
	let receiver = instrumentationClientResultMetaReceivers.get(router);
	instrumentationClientResultMetaReceivers.delete(router);
	return receiver;
}
function throwOrReturnResult(result) {
	if (result.type === "error") throw result.value;
	return result.value;
}
async function recurseRight(impls, info, handler, getInnerResult, state = {
	result: null,
	innerResult: null
}, index = impls.length - 1) {
	let impl = impls[index];
	if (!impl) {
		try {
			state.result = {
				type: "success",
				value: await handler()
			};
		} catch (e) {
			state.result = {
				type: "error",
				value: e
			};
		}
		state.innerResult = getInnerResult(state.result, info);
	} else {
		let handlerPromise = void 0;
		let callHandler = async () => {
			if (handlerPromise) console.error("You cannot call instrumented handlers more than once");
			else handlerPromise = recurseRight(impls, info, handler, getInnerResult, state, index - 1);
			await handlerPromise;
			invariant(state.innerResult, "Expected an inner result");
			return state.innerResult;
		};
		try {
			await impl(callHandler, info);
		} catch (e) {
			console.error("An instrumentation function threw an error:", e);
		}
		if (!handlerPromise) await callHandler();
		await handlerPromise;
	}
	if (state.result) return state.result;
	state.result = {
		type: "error",
		value: /* @__PURE__ */ new Error("No result assigned in instrumentation chain.")
	};
	state.innerResult = getInnerResult(state.result, info);
	return state.result;
}
function getInstrumentationInnerResult(result) {
	if (result.type === "error" && result.value instanceof Error) return {
		status: "error",
		error: result.value
	};
	return {
		status: "success",
		error: void 0
	};
}
function getHandlerInfo(args) {
	let { request, context, params } = args;
	return {
		...args,
		request: getReadonlyRequest(request),
		params: { ...params },
		context: getReadonlyContext(context)
	};
}
function getRouterInfo(router, opts) {
	return {
		currentUrl: createPath(router.state.location),
		..."formMethod" in opts ? { formMethod: opts.formMethod } : {},
		..."formEncType" in opts ? { formEncType: opts.formEncType } : {},
		..."formData" in opts ? { formData: opts.formData } : {},
		..."body" in opts ? { body: opts.body } : {}
	};
}
function getReadonlyRequest(request) {
	return {
		method: request.method,
		url: request.url,
		headers: { get: (...args) => request.headers.get(...args) }
	};
}
function getReadonlyContext(context) {
	return { get: (ctx) => context.get(ctx) };
}
//#endregion
export { consumeInstrumentationClientResultMetaReceiver, getRouteInstrumentationUpdates, instrumentClientSideRouter, instrumentHandler, instrumentationResultMetaContext };
