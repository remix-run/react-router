/**
 * react-router v8.3.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { unreachable } from "../unreachable.js";
import { escape } from "./regexp.js";
//#region lib/router/route-pattern/src/lib/match/variant.ts
function generatePathnameVariants(pathname, options) {
	let result = [];
	let ignoreCase = options?.ignoreCase ?? false;
	for (let tokens of generatePartVariants(pathname)) {
		let variant = [];
		let key = "";
		let reSource = "";
		let reFlags = ignoreCase ? "di" : "d";
		let type = "static";
		let params = [];
		for (let token of tokens) {
			if (token.type === "separator") {
				if (type === "static") {
					variant.push({
						type: "static",
						key: ignoreCase ? key.toLowerCase() : key
					});
					key = "";
					reSource = "";
					continue;
				}
				if (type === "variable") {
					variant.push({
						type: "variable",
						key,
						regexp: new RegExp(`^${reSource}$`, reFlags),
						params
					});
					key = "";
					reSource = "";
					params = [];
					type = "static";
					continue;
				}
				if (type === "wildcard") {
					key += "/";
					reSource += escape("/");
					continue;
				}
				unreachable(type);
			}
			if (token.type === "text") {
				let text = encodeURIComponent(token.text);
				key += text;
				reSource += escape(text);
				continue;
			}
			if (token.type === ":") {
				key += "{:}";
				reSource += `([^/]+)`;
				params.push(token);
				if (type === "static") type = "variable";
				continue;
			}
			if (token.type === "*") {
				key += "{*}";
				reSource += `(.*)`;
				params.push(token);
				type = "wildcard";
				continue;
			}
			unreachable(token.type);
		}
		if (type === "static") variant.push({
			type: "static",
			key: ignoreCase ? key.toLowerCase() : key
		});
		if (type === "variable" || type === "wildcard") variant.push({
			type,
			key,
			regexp: new RegExp(`^${reSource}$`, reFlags),
			params
		});
		result.push(variant);
	}
	return result;
}
/**
* Expand a part pattern's optionals into the list of all concrete variants.
*
* Each variant is the linear token sequence you'd get by independently choosing
* to include or omit every `(` `)` group. No nesting, no optional markers.
*
* @private
*/
function generatePartVariants(part) {
	let result = [];
	let stack = [{
		index: 0,
		tokens: []
	}];
	while (stack.length > 0) {
		let { index, tokens } = stack.pop();
		if (index === part.tokens.length) {
			result.push(tokens);
			continue;
		}
		let token = part.tokens[index];
		if (token.type === "(") {
			stack.push({
				index: index + 1,
				tokens
			}, {
				index: part.optionals.get(index) + 1,
				tokens: tokens.slice()
			});
			continue;
		}
		if (token.type === ")") {
			stack.push({
				index: index + 1,
				tokens
			});
			continue;
		}
		if (token.type === ":" || token.type === "*" || token.type === "text" || token.type === "separator") {
			tokens.push(token);
			stack.push({
				index: index + 1,
				tokens
			});
			continue;
		}
		unreachable(token.type);
	}
	return result;
}
//#endregion
export { generatePathnameVariants };
