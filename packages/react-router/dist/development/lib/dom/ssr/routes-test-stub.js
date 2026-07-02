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
import { RouterContextProvider, convertRoutesToDataRoutes } from "../../router/utils.js";
import { Outlet, RouterProvider, createMemoryRouter, withComponentProps, withErrorBoundaryProps, withHydrateFallbackProps } from "../../components.js";
import { FrameworkContext } from "./components.js";
import * as React$1 from "react";
//#region lib/dom/ssr/routes-test-stub.tsx
/**
* @category Utils
*/
function createRoutesStub(routes, _context) {
	return function RoutesTestStub({ initialEntries, initialIndex, hydrationData, future }) {
		let routerRef = React$1.useRef(null);
		let frameworkContextRef = React$1.useRef(null);
		if (routerRef.current == null || frameworkContextRef.current == null) {
			frameworkContextRef.current = {
				future: {},
				manifest: {
					routes: {},
					entry: {
						imports: [],
						module: ""
					},
					url: "",
					version: ""
				},
				routeModules: {},
				ssr: false,
				isSpaMode: false,
				routeDiscovery: {
					mode: "lazy",
					manifestPath: "/__manifest"
				}
			};
			routerRef.current = createMemoryRouter(processRoutes(convertRoutesToDataRoutes(routes, (r) => r), _context ?? new RouterContextProvider(), frameworkContextRef.current.manifest, frameworkContextRef.current.routeModules), {
				initialEntries,
				initialIndex,
				hydrationData
			});
		}
		return /* @__PURE__ */ React$1.createElement(FrameworkContext.Provider, { value: frameworkContextRef.current }, /* @__PURE__ */ React$1.createElement(RouterProvider, { router: routerRef.current }));
	};
}
function processRoutes(routes, context, manifest, routeModules, parentId) {
	return routes.map((route) => {
		if (!route.id) throw new Error("Expected a route.id in react-router processRoutes() function");
		let newRoute = {
			id: route.id,
			path: route.path,
			index: route.index,
			Component: route.Component ? withComponentProps(route.Component) : void 0,
			HydrateFallback: route.HydrateFallback ? withHydrateFallbackProps(route.HydrateFallback) : void 0,
			ErrorBoundary: route.ErrorBoundary ? withErrorBoundaryProps(route.ErrorBoundary) : void 0,
			action: route.action ? (args) => route.action({
				...args,
				context
			}) : void 0,
			loader: route.loader ? (args) => route.loader({
				...args,
				context
			}) : void 0,
			middleware: route.middleware ? route.middleware.map((mw) => (...args) => mw({
				...args[0],
				context
			}, args[1])) : void 0,
			handle: route.handle,
			shouldRevalidate: route.shouldRevalidate
		};
		let entryRoute = {
			id: route.id,
			path: route.path,
			index: route.index,
			parentId,
			hasAction: route.action != null,
			hasLoader: route.loader != null,
			hasClientAction: false,
			hasClientLoader: false,
			hasClientMiddleware: false,
			hasErrorBoundary: route.ErrorBoundary != null,
			module: "build/stub-path-to-module.js",
			clientActionModule: void 0,
			clientLoaderModule: void 0,
			clientMiddlewareModule: void 0,
			hydrateFallbackModule: void 0
		};
		manifest.routes[newRoute.id] = entryRoute;
		routeModules[route.id] = {
			default: newRoute.Component || Outlet,
			ErrorBoundary: newRoute.ErrorBoundary || void 0,
			handle: route.handle,
			links: route.links,
			meta: route.meta,
			shouldRevalidate: route.shouldRevalidate
		};
		if (route.children) newRoute.children = processRoutes(route.children, context, manifest, routeModules, newRoute.id);
		return newRoute;
	});
}
//#endregion
export { createRoutesStub };
