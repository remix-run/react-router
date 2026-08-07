/**
 * react-router v8.3.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
//#region lib/server-runtime/dev.ts
const globalDevServerHooksKey = "__reactRouterDevServerHooks";
function setDevServerHooks(devServerHooks) {
	globalThis[globalDevServerHooksKey] = devServerHooks;
}
function getDevServerHooks() {
	return globalThis[globalDevServerHooksKey];
}
function getBuildTimeHeader(request, headerName) {
	if (typeof process !== "undefined") try {
		if (process.env.hasOwnProperty("IS_RR_BUILD_REQUEST") && process.env.IS_RR_BUILD_REQUEST === "yes") return request.headers.get(headerName);
	} catch (e) {}
	return null;
}
//#endregion
export { getBuildTimeHeader, getDevServerHooks, setDevServerHooks };
