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
import { parsePart } from "./route-pattern/parse.js";
import { Trie } from "./match/trie.js";
import { descending } from "./specificity.js";
//#region lib/router/route-pattern/src/lib/match.ts
function createPathnameMultiMatcher(options) {
	let trie = new Trie(options);
	return {
		add(pattern, data) {
			trie.insert({ pathname: parsePart(pattern, {
				span: [pattern.startsWith("/") ? 1 : 0, pattern.length],
				type: "pathname"
			}) }, data);
		},
		matchAll(url) {
			return trie.search(url).sort(descending);
		}
	};
}
//#endregion
export { createPathnameMultiMatcher };
