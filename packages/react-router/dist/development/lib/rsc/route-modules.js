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
//#region lib/rsc/route-modules.ts
function createRSCRouteModules(payload) {
	const routeModules = {};
	for (const match of payload.matches) populateRSCRouteModules(routeModules, match);
	return routeModules;
}
function populateRSCRouteModules(routeModules, matches) {
	matches = Array.isArray(matches) ? matches : [matches];
	for (const match of matches) routeModules[match.id] = {
		links: match.links,
		meta: match.meta,
		default: noopComponent
	};
}
const noopComponent = () => null;
//#endregion
export { createRSCRouteModules, populateRSCRouteModules };
