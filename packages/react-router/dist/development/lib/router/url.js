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
//#region lib/router/url.ts
const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|[\\/]{2})/i;
const PROTOCOL_RELATIVE_URL_REGEX = /^[\\/]{2}/;
function normalizeRelativeUrl(url) {
	if (ABSOLUTE_URL_REGEX.test(url)) return url;
	let normalized = url.replace(/[\t\n\r]/g, "");
	if (!ABSOLUTE_URL_REGEX.test(normalized)) return normalized;
	if (PROTOCOL_RELATIVE_URL_REGEX.test(normalized)) return normalized.replace(/^[\\/]+/, "/");
	return normalized.replace(/^([a-z][a-z0-9+.-]*):/i, "$1%3A");
}
function normalizeProtocolRelativeUrl(url, protocol) {
	return protocol + url.replace(/\\/g, "/");
}
//#endregion
export { ABSOLUTE_URL_REGEX, PROTOCOL_RELATIVE_URL_REGEX, normalizeProtocolRelativeUrl, normalizeRelativeUrl };
