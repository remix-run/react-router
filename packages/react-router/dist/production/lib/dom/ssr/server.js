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
import { StreamTransfer } from "./single-fetch.js";
import { RemixErrorBoundary } from "./errorBoundaries.js";
import { createServerRoutes, shouldHydrateRouteLoader } from "./routes.js";
import { FrameworkContext } from "./components.js";
import { StaticRouterProvider, createStaticRouter } from "../server.js";
import * as React$1 from "react";
//#region lib/dom/ssr/server.tsx
/**
* The server entry point for a React Router app in Framework Mode. This
* component is used to generate the HTML in the response from the server. See
* [`entry.server.tsx`](../framework-conventions/entry.server.tsx).
*
* @public
* @category Framework Routers
* @mode framework
* @param props Props
* @param {ServerRouterProps.context} props.context n/a
* @param {ServerRouterProps.nonce} props.nonce n/a
* @param {ServerRouterProps.url} props.url n/a
* @returns A React element that represents the server-rendered application.
*/
function ServerRouter({ context, url, nonce }) {
	if (typeof url === "string") url = new URL(url);
	let { manifest, routeModules, criticalCss, serverHandoffString } = context;
	let routes = createServerRoutes(manifest.routes, routeModules, context.future, context.isSpaMode);
	context.staticHandlerContext.loaderData = { ...context.staticHandlerContext.loaderData };
	for (let match of context.staticHandlerContext.matches) {
		let routeId = match.route.id;
		let route = routeModules[routeId];
		let manifestRoute = context.manifest.routes[routeId];
		if (route && manifestRoute && shouldHydrateRouteLoader(routeId, route.clientLoader, manifestRoute.hasLoader, context.isSpaMode) && (route.HydrateFallback || !manifestRoute.hasLoader)) delete context.staticHandlerContext.loaderData[routeId];
	}
	let router = createStaticRouter(routes, context.staticHandlerContext, { branches: context.branches });
	return /* @__PURE__ */ React$1.createElement(React$1.Fragment, null, /* @__PURE__ */ React$1.createElement(FrameworkContext.Provider, { value: {
		manifest,
		routeModules,
		criticalCss,
		serverHandoffString,
		future: context.future,
		ssr: context.ssr,
		isSpaMode: context.isSpaMode,
		routeDiscovery: context.routeDiscovery,
		nonce,
		serializeError: context.serializeError,
		renderMeta: context.renderMeta
	} }, /* @__PURE__ */ React$1.createElement(RemixErrorBoundary, { location: router.state.location }, /* @__PURE__ */ React$1.createElement(StaticRouterProvider, {
		router,
		context: context.staticHandlerContext,
		hydrate: false
	}))), context.serverHandoffStream ? /* @__PURE__ */ React$1.createElement(React$1.Suspense, null, /* @__PURE__ */ React$1.createElement(StreamTransfer, {
		context,
		identifier: 0,
		reader: context.serverHandoffStream.getReader(),
		textDecoder: new TextDecoder(),
		nonce
	})) : null);
}
//#endregion
export { ServerRouter };
