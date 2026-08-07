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
import { redirect, redirectDocument, replace } from "../router/utils.js";
import { SingleFetchRedirectSymbol, decodeViaTurboStream } from "../dom/ssr/single-fetch.js";
import invariant from "./invariant.js";
import { callRouteHandler } from "./data.js";
import { getBuildTimeHeader } from "./dev.js";
//#region lib/server-runtime/routes.ts
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
function createStaticHandlerDataRoutes(manifest, parentId = "", routesByParentId = groupRoutesByParentId(manifest)) {
	return (routesByParentId[parentId] || []).map((route) => {
		let commonRoute = {
			id: route.id,
			path: route.path,
			middleware: route.module.middleware,
			loader: route.module.loader ? async (args) => {
				let preRenderedData = getBuildTimeHeader(args.request, "X-React-Router-Prerender-Data");
				if (preRenderedData != null) {
					let encoded = preRenderedData ? decodeURI(preRenderedData) : preRenderedData;
					invariant(encoded, "Missing prerendered data for route");
					let uint8array = new TextEncoder().encode(encoded);
					let data = (await decodeViaTurboStream(new ReadableStream({ start(controller) {
						controller.enqueue(uint8array);
						controller.close();
					} }), global)).value;
					if (data && SingleFetchRedirectSymbol in data) {
						let result = data[SingleFetchRedirectSymbol];
						let init = { status: result.status };
						if (result.reload) throw redirectDocument(result.redirect, init);
						else if (result.replace) throw replace(result.redirect, init);
						else throw redirect(result.redirect, init);
					} else {
						invariant(data && route.id in data, "Unable to decode prerendered data");
						let result = data[route.id];
						invariant("data" in result, "Unable to process prerendered data");
						return result.data;
					}
				}
				return await callRouteHandler(route.module.loader, args);
			} : void 0,
			action: route.module.action ? (args) => callRouteHandler(route.module.action, args) : void 0,
			ErrorBoundary: route.id === "root" || route.module.ErrorBoundary != null ? () => null : void 0,
			handle: route.module.handle
		};
		return route.index ? {
			index: true,
			...commonRoute
		} : {
			caseSensitive: route.caseSensitive,
			children: createStaticHandlerDataRoutes(manifest, route.id, routesByParentId),
			...commonRoute
		};
	});
}
//#endregion
export { createStaticHandlerDataRoutes };
