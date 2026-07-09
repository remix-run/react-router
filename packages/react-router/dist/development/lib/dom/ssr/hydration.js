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
import { matchRoutes } from "../../router/utils.js";
import { shouldHydrateRouteLoader } from "./routes.js";
//#region lib/dom/ssr/hydration.tsx
function getHydrationData({ state, routes, getRouteInfo, location, basename, isSpaMode }) {
	let hydrationData = {
		...state,
		loaderData: { ...state.loaderData }
	};
	let initialMatches = matchRoutes(routes, location, basename);
	if (initialMatches) for (let match of initialMatches) {
		let routeId = match.route.id;
		let routeInfo = getRouteInfo(routeId);
		if (shouldHydrateRouteLoader(routeId, routeInfo.clientLoader, routeInfo.hasLoader, isSpaMode) && (routeInfo.hasHydrateFallback || !routeInfo.hasLoader)) delete hydrationData.loaderData[routeId];
		else if (!routeInfo.hasLoader) hydrationData.loaderData[routeId] = null;
	}
	return hydrationData;
}
//#endregion
export { getHydrationData };
