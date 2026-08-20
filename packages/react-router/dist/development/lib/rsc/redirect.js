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
import { PROTOCOL_RELATIVE_URL_REGEX, normalizeRelativeUrl } from "../router/url.js";
import { resolvePath } from "../router/utils.js";
//#region lib/rsc/redirect.ts
function normalizeRedirectLocation(location) {
	location = normalizeRelativeUrl(location);
	if (PROTOCOL_RELATIVE_URL_REGEX.test(location)) {
		let path = resolvePath(location);
		return path.pathname + path.search + path.hash;
	}
	return location;
}
//#endregion
export { normalizeRedirectLocation };
