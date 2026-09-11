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
//#region lib/router/route-pattern/src/lib/specificity.ts
/**
* Comparator function for sorting matches from most specific to least specific.
*
* @param a the first match to compare
* @param b the second match to compare
* @returns positive if `a` is less specific, negative if more specific, 0 if equal
*/
const descending = (a, b) => compare(a, b) * -1;
/**
* Compare two matches by specificity.
* Passing to `.sort()` will sort matches from least specific to most specific.
*
* @param a the first match to compare
* @param b the second match to compare
* @returns -1 if `a` is less specific, 1 if `a` is more specific, 0 if tied.
*/
function compare(a, b) {
	return comparePathname(a.paramsMeta.pathname, b.paramsMeta.pathname);
}
function comparePathname(a, b) {
	if (a.length === 0 && b.length === 0) return 0;
	if (a.length === 0 && b.length > 0) return 1;
	if (a.length > 0 && b.length === 0) return -1;
	let i = 0;
	let aIndex = 0;
	let bIndex = 0;
	while (aIndex < a.length || bIndex < b.length) {
		let aRange = a[aIndex];
		let bRange = b[bIndex];
		if (aRange === void 0) return 1;
		if (bRange === void 0) return -1;
		i = Math.min(aRange.begin, bRange.begin);
		if (i < aRange.begin) return 1;
		if (i < bRange.begin) return -1;
		if (aRange.type === ":" && bRange.type === "*") return 1;
		if (aRange.type === "*" && bRange.type === ":") return -1;
		i = Math.min(aRange.end, bRange.end);
		if (i >= aRange.end) aIndex += 1;
		if (i >= bRange.end) bIndex += 1;
	}
	return 0;
}
//#endregion
export { descending };
