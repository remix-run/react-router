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
//#region lib/dom/ssr/data.ts
async function createRequestInit(request) {
	let init = { signal: request.signal };
	if (request.method !== "GET") {
		init.method = request.method;
		let contentType = request.headers.get("Content-Type");
		if (contentType && /\bapplication\/json\b/.test(contentType)) {
			init.headers = { "Content-Type": contentType };
			init.body = JSON.stringify(await request.json());
		} else if (contentType && /\btext\/plain\b/.test(contentType)) {
			init.headers = { "Content-Type": contentType };
			init.body = await request.text();
		} else if (contentType && /\bapplication\/x-www-form-urlencoded\b/.test(contentType)) init.body = new URLSearchParams(await request.text());
		else init.body = await request.formData();
	}
	return init;
}
//#endregion
export { createRequestInit };
