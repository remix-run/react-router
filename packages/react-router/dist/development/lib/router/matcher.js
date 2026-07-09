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
		return this.#branches;
	}
	match(locationArg, allowPartial) {
		return matchRoutesImpl(this.#routes, locationArg, this.#basename, allowPartial, this.#branches);
	}
};
//#endregion
export { V6RegExMatcher };
