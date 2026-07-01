/**
 * react-router v8.1.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
//#region lib/dom/ssr/invariant.ts
function invariant(value, message) {
	if (value === false || value === null || typeof value === "undefined") throw new Error(message);
}
//#endregion
export { invariant as default };
