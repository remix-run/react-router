/**
 * react-router v8.4.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { CRITICAL_CSS_DATA_ATTRIBUTE } from "../dom/ssr/components.js";
import { RouterProvider as RouterProvider$1 } from "./dom-router-provider.js";
import * as React$1 from "react";
import { UNSAFE_FrameworkContext, UNSAFE_RemixErrorBoundary, UNSAFE_RouteDiscoveryRuntime, UNSAFE_createBrowserHistory, UNSAFE_createClientRoutes, UNSAFE_createClientRoutesWithHMRRevalidationOptOut, UNSAFE_createRouter, UNSAFE_decodeViaTurboStream, UNSAFE_defaultMapRouteProperties, UNSAFE_getCustomPatchRoutesOnNavigationFunction, UNSAFE_getHydrationData, UNSAFE_getPatchRoutesOnNavigationFunction, UNSAFE_getTurboStreamSingleFetchDataStrategy, UNSAFE_hydrationRouteProperties, UNSAFE_invariant, UNSAFE_useCustomRouteDiscovery, UNSAFE_useFogOFWarDiscovery } from "react-router";
//#region lib/dom-export/hydrated-router.tsx
let ssrInfo = null;
let router = null;
let fetchImplementation = (request) => window.fetch(request);
function initSsrInfo() {
	if (!ssrInfo && window.__reactRouterContext && window.__reactRouterManifest && window.__reactRouterRouteModules) {
		if (window.__reactRouterManifest.sri === true) {
			const importMap = document.querySelector("script[rr-importmap]");
			if (importMap?.textContent) try {
				window.__reactRouterManifest.sri = JSON.parse(importMap.textContent).integrity;
			} catch (err) {
				console.error("Failed to parse import map", err);
			}
		}
		ssrInfo = {
			context: window.__reactRouterContext,
			manifest: window.__reactRouterManifest,
			routeModules: window.__reactRouterRouteModules,
			stateDecodingPromise: void 0,
			router: void 0,
			routeDiscoveryRuntime: void 0,
			routerInitialized: false
		};
	}
}
function createHydratedRouter({ getContext, instrumentations, fetch: fetchImplementation }) {
	initSsrInfo();
	if (!ssrInfo) throw new Error("You must be using the SSR features of React Router in order to skip passing a `router` prop to `<RouterProvider>`");
	let localSsrInfo = ssrInfo;
	let isApiOnly = ssrInfo.context.unstable_apiOnly === true;
	let ssr = ssrInfo.context.ssr;
	if (!ssrInfo.stateDecodingPromise) {
		let stream = ssrInfo.context.stream;
		UNSAFE_invariant(stream, "No stream found for single fetch decoding");
		ssrInfo.context.stream = void 0;
		ssrInfo.stateDecodingPromise = UNSAFE_decodeViaTurboStream(stream, window).then((value) => {
			ssrInfo.context.state = value.value;
			localSsrInfo.stateDecodingPromise.value = true;
		}).catch((e) => {
			localSsrInfo.stateDecodingPromise.error = e;
		});
	}
	if (ssrInfo.stateDecodingPromise.error) throw ssrInfo.stateDecodingPromise.error;
	if (!ssrInfo.stateDecodingPromise.value) throw ssrInfo.stateDecodingPromise;
	let routes = UNSAFE_createClientRoutes(ssrInfo.manifest.routes, ssrInfo.routeModules, ssrInfo.context.state, ssr, ssrInfo.context.isSpaMode, "", void 0, void 0, isApiOnly);
	let hydrationData = void 0;
	if (ssrInfo.context.isSpaMode) {
		let { loaderData } = ssrInfo.context.state;
		if (ssrInfo.manifest.routes.root?.hasLoader && loaderData && "root" in loaderData) hydrationData = { loaderData: { root: loaderData.root } };
	} else hydrationData = UNSAFE_getHydrationData({
		state: ssrInfo.context.state,
		routes,
		getRouteInfo: (routeId) => ({
			clientLoader: ssrInfo.routeModules[routeId]?.clientLoader,
			hasLoader: ssrInfo.manifest.routes[routeId]?.hasLoader === true,
			hasHydrateFallback: ssrInfo.routeModules[routeId]?.HydrateFallback != null
		}),
		location: window.location,
		basename: window.__reactRouterContext?.basename,
		future: ssrInfo.context.future,
		isSpaMode: ssrInfo.context.isSpaMode
	});
	if (window.history.state && window.history.state.masked) window.history.replaceState({
		...window.history.state,
		masked: void 0
	}, "");
	let discoveryRuntime = ssrInfo.context.future.unstable_customRouteDiscovery ? new UNSAFE_RouteDiscoveryRuntime(() => router, ssrInfo.manifest, ssrInfo.routeModules, ssrInfo.context.ssr, ssrInfo.context.routeDiscovery, ssrInfo.context.isSpaMode, ssrInfo.context.basename, void 0, fetchImplementation, ssrInfo.context.unstable_apiServerOrigin, isApiOnly) : void 0;
	let router = UNSAFE_createRouter({
		routes,
		history: UNSAFE_createBrowserHistory(),
		future: { unstable_customRouteDiscovery: ssrInfo.context.future.unstable_customRouteDiscovery },
		basename: ssrInfo.context.basename,
		getContext,
		hydrationData,
		mapRouteProperties: UNSAFE_defaultMapRouteProperties,
		hydrationRouteProperties: UNSAFE_hydrationRouteProperties,
		instrumentations,
		dataStrategy: UNSAFE_getTurboStreamSingleFetchDataStrategy(() => router, ssrInfo.manifest, ssrInfo.routeModules, ssr, fetchImplementation, ssrInfo.context.unstable_apiOnly === true, ssrInfo.context.unstable_apiServerOrigin),
		patchRoutesOnNavigation: discoveryRuntime ? UNSAFE_getCustomPatchRoutesOnNavigationFunction(() => router, discoveryRuntime) : UNSAFE_getPatchRoutesOnNavigationFunction(() => router, ssrInfo.manifest, ssrInfo.routeModules, ssr, ssrInfo.context.routeDiscovery, ssrInfo.context.isSpaMode, ssrInfo.context.basename, fetchImplementation, ssrInfo.context.unstable_apiServerOrigin, isApiOnly)
	});
	ssrInfo.router = router;
	ssrInfo.routeDiscoveryRuntime = discoveryRuntime;
	if (router.state.initialized) {
		ssrInfo.routerInitialized = true;
		router.initialize();
	}
	router.createRoutesForHMR = UNSAFE_createClientRoutesWithHMRRevalidationOptOut;
	window.__reactRouterDataRouter = router;
	return router;
}
/**
* Framework-mode router component to be used to hydrate a router from a
* {@link ServerRouter}. See [`entry.client.tsx`](../framework-conventions/entry.client.tsx).
*
* @public
* @category Framework Routers
* @mode framework
* @param props Props
* @param {dom.HydratedRouterProps.getContext} props.getContext n/a
* @param {dom.HydratedRouterProps.onError} props.onError n/a
* @param {dom.HydratedRouterProps.unstable_fetch} props.unstable_fetch n/a
* @returns A React element that represents the hydrated application.
*/
function HydratedRouter(props) {
	if (!router) {
		router = createHydratedRouter({
			getContext: props.getContext,
			instrumentations: props.instrumentations,
			fetch: props.unstable_fetch ?? fetchImplementation
		});
		if (props.unstable_fetch) fetchImplementation = props.unstable_fetch;
	}
	let [criticalCss, setCriticalCss] = React$1.useState(process.env.NODE_ENV === "development" ? ssrInfo?.context.criticalCss : void 0);
	React$1.useEffect(() => {
		if (process.env.NODE_ENV === "development") setCriticalCss(void 0);
	}, []);
	React$1.useEffect(() => {
		if (process.env.NODE_ENV === "development" && criticalCss === void 0) document.querySelectorAll(`[${CRITICAL_CSS_DATA_ATTRIBUTE}]`).forEach((element) => element.remove());
	}, [criticalCss]);
	let [location, setLocation] = React$1.useState(router.state.location);
	React$1.useLayoutEffect(() => {
		if (ssrInfo && ssrInfo.router && !ssrInfo.routerInitialized) {
			ssrInfo.routerInitialized = true;
			ssrInfo.router.initialize();
		}
	}, []);
	React$1.useLayoutEffect(() => {
		if (ssrInfo && ssrInfo.router) return ssrInfo.router.subscribe((newState) => {
			if (newState.location !== location) setLocation(newState.location);
		});
	}, [location]);
	UNSAFE_invariant(ssrInfo, "ssrInfo unavailable for HydratedRouter");
	let ssr = ssrInfo.context.ssr;
	let discoveryRuntime = ssrInfo.routeDiscoveryRuntime;
	let discoveryState;
	if (discoveryRuntime) discoveryState = UNSAFE_useCustomRouteDiscovery(discoveryRuntime, props.onError);
	else UNSAFE_useFogOFWarDiscovery(router, ssrInfo.manifest, ssrInfo.routeModules, ssr, ssrInfo.context.routeDiscovery, ssrInfo.context.isSpaMode, fetchImplementation, ssrInfo.context.unstable_apiServerOrigin, ssrInfo.context.unstable_apiOnly === true);
	return /* @__PURE__ */ React$1.createElement(React$1.Fragment, null, /* @__PURE__ */ React$1.createElement(UNSAFE_FrameworkContext.Provider, { value: {
		routeDiscoveryRuntime: discoveryRuntime,
		routeDiscoveryState: discoveryState,
		manifest: ssrInfo.manifest,
		routeModules: ssrInfo.routeModules,
		future: ssrInfo.context.future,
		criticalCss,
		ssr: ssrInfo.context.ssr,
		isSpaMode: ssrInfo.context.isSpaMode,
		unstable_apiOnly: ssrInfo.context.unstable_apiOnly,
		routeDiscovery: ssrInfo.context.routeDiscovery,
		unstable_apiServerOrigin: ssrInfo.context.unstable_apiServerOrigin
	} }, /* @__PURE__ */ React$1.createElement(UNSAFE_RemixErrorBoundary, { location }, /* @__PURE__ */ React$1.createElement(RouterProvider$1, {
		router,
		useTransitions: props.useTransitions,
		onError: props.onError
	}))), /* @__PURE__ */ React$1.createElement(React$1.Fragment, null));
}
//#endregion
export { HydratedRouter };
