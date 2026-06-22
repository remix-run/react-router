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
//#region lib/server-runtime/urls.ts
function getNormalizedPath(request) {
	let url = new URL(request.url);
	let pathname = url.pathname;
	if (pathname.endsWith("/_.data")) pathname = pathname.replace(/_\.data$/, "");
	else pathname = pathname.replace(/\.data$/, "");
	let searchParams = new URLSearchParams(url.search);
	searchParams.delete("_routes");
	let search = searchParams.toString();
	if (search) search = `?${search}`;
	return {
		pathname,
		search,
		hash: ""
	};
}
//#endregion
export { getNormalizedPath };
