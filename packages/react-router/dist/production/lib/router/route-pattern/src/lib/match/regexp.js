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
//#region lib/router/route-pattern/src/lib/match/regexp.ts
/**
* Emulates the `RegExp.escape()` available in all latest browsers and runtimes, but not in Node 22.
* See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape#browser_compatibility
*
* @param text The text to escape.
* @returns The escaped text.
*/
function escape(text) {
	return text.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
}
//#endregion
export { escape };
