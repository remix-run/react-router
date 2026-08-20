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
import { encodePathParam } from "./router/utils.js";
//#region lib/href.ts
function stringify(p) {
	return p == null ? "" : typeof p === "string" ? p : String(p);
}
/**
* Returns a resolved URL path for the specified route.
*
* Param values are percent-encoded for use in a path segment: characters that
* would change the URL structure (`/`, `?`, `#`, `%`, whitespace, non-ASCII)
* are escaped, while characters that RFC 3986 allows literally in a path
* segment (`$ & + , ; = : @`) are kept as-is. Note this differs from query-string
* encoding (`encodeURIComponent`/`URLSearchParams`), where those characters are
* delimiters and must be escaped. Splat (`*`) values are encoded per segment,
* preserving `/` separators.
*
* See [RFC 3986 §3.3](https://datatracker.ietf.org/doc/html/rfc3986#section-3.3)
*
* @example
* const h = href("/:lang?/about", { lang: "en" })
* // -> `/en/about`
*
* <Link to={href("/products/:id", { id: "abc123" })} />
*
* @public
* @category Utils
* @mode framework
* @param path The route path to resolve
* @param args The route params to use when resolving the path
* @returns The resolved URL path
*/
function href(path, ...args) {
	let params = args[0];
	let result = trimTrailingSplat(path).replace(/\/:([\w-]+)(\?)?/g, (_, param, questionMark) => {
		const isRequired = questionMark === void 0;
		const value = params?.[param];
		if (isRequired && value === void 0) throw new Error(`Path '${path}' requires param '${param}' but it was not provided`);
		return value == null ? "" : "/" + encodePathParam(stringify(value));
	});
	if (path.endsWith("*")) {
		const value = params?.["*"];
		if (value !== void 0) result += "/" + stringify(value).split("/").map(encodePathParam).join("/");
	}
	return result || "/";
}
/**
* Removes a trailing splat and any number of slashes from the end of the path.
*
* Benchmarked to be faster than `path.replace(/\/*\*?$/, "")`, which backtracks.
*/
function trimTrailingSplat(path) {
	let i = path.length - 1;
	let char = path[i];
	if (char !== "*" && char !== "/") return path;
	i--;
	for (; i >= 0; i--) if (path[i] !== "/") break;
	return path.slice(0, i + 1);
}
//#endregion
export { href };
