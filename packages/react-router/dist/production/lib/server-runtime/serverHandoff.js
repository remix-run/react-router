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
import { escapeHtml } from "../dom/ssr/markup.js";
//#region lib/server-runtime/serverHandoff.ts
function createServerHandoffString(serverHandoff) {
	return escapeHtml(JSON.stringify(serverHandoff));
}
//#endregion
export { createServerHandoffString };
