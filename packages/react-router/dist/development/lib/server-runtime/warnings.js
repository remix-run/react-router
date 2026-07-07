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
//#region lib/server-runtime/warnings.ts
const alreadyWarned = {};
function warnOnce(condition, message) {
	if (!condition && !alreadyWarned[message]) {
		alreadyWarned[message] = true;
		console.warn(message);
	}
}
//#endregion
export { warnOnce };
