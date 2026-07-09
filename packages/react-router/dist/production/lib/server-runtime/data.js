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
import { isDataWithResponseInit, isRedirectStatusCode } from "../router/router.js";
//#region lib/server-runtime/data.ts
async function callRouteHandler(handler, args) {
	let result = await handler({
		request: args.request,
		url: args.url,
		params: args.params,
		context: args.context,
		pattern: args.pattern
	});
	if (isDataWithResponseInit(result) && result.init && result.init.status && isRedirectStatusCode(result.init.status)) throw new Response(null, result.init);
	return result;
}
//#endregion
export { callRouteHandler };
