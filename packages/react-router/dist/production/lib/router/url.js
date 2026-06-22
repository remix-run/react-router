/**
 * react-router v8.0.1
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
function normalizeProtocolRelativeUrl(url, protocol) {
	return protocol + url.replace(/\\/g, "/");
}
//#endregion
export { ABSOLUTE_URL_REGEX, PROTOCOL_RELATIVE_URL_REGEX, normalizeProtocolRelativeUrl };
