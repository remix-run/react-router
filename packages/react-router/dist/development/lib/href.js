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
//#region lib/href.ts
/**
Returns a resolved URL path for the specified route.

```tsx
const h = href("/:lang?/about", { lang: "en" })
// -> `/en/about`

<Link to={href("/products/:id", { id: "abc123" })} />
```
*/
function href(path, ...args) {
	let params = args[0];
	let result = trimTrailingSplat(path).replace(/\/:([\w-]+)(\?)?/g, (_, param, questionMark) => {
		const isRequired = questionMark === void 0;
		const value = params?.[param];
		if (isRequired && value === void 0) throw new Error(`Path '${path}' requires param '${param}' but it was not provided`);
		return value === void 0 ? "" : "/" + value;
	});
	if (path.endsWith("*")) {
		const value = params?.["*"];
		if (value !== void 0) result += "/" + value;
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
