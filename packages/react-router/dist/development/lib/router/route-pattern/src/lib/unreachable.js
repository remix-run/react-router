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
//#region lib/router/route-pattern/src/lib/unreachable.ts
/**
* An internal error that should never happen.
*
* @param value Typed as `never` to ensure exhaustiveness for discriminated unions.
*/
function unreachable(value) {
	let message = value === void 0 ? "Unreachable" : `Unreachable: ${value}`;
	throw new Error(message);
}
//#endregion
export { unreachable };
