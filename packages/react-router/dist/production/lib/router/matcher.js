/**
 * react-router v8.3.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { flattenAndRankRoutes, matchRoutesImpl } from "./utils.js";
//#region lib/router/matcher.ts
var V6RegExMatcher = class {
	#routes = [];
	#branches = [];
	#basename;
	constructor(basename) {
		this.#basename = basename;
	}
	update(routes) {
		this.#routes = routes;
		this.#branches = flattenAndRankRoutes(routes);
	}
	match(locationArg, allowPartial = false) {
		return matchRoutesImpl(this.#routes, locationArg, this.#basename, allowPartial, this.#branches);
	}
};
//#endregion
export { V6RegExMatcher };
