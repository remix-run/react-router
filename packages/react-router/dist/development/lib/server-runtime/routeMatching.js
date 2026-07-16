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
import { matchRoutesImpl } from "../router/utils.js";
import invariant from "./invariant.js";
//#region lib/server-runtime/routeMatching.ts
function matchServerRoutes(manifest, dataRoutes, branches, pathname, basename) {
	let matches = matchRoutesImpl(dataRoutes, pathname, basename ?? "/", false, branches);
	if (!matches) return null;
	return matches.map((match) => {
		let route = manifest[match.route.id];
		invariant(route, `Route with id "${match.route.id}" not found in manifest.`);
		return {
			params: match.params,
			pathname: match.pathname,
			route
		};
	});
}
//#endregion
export { matchServerRoutes };
