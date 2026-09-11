/**
 * react-router v8.4.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
//#region lib/router/route-pattern/src/lib/route-pattern/parse.ts
const IDENTIFIER_RE = /^[a-zA-Z_$][a-zA-Z_$0-9]*/;
/**
* Parse a single URL part (hostname or pathname).
*
* @private
*/
function parsePart(source, options) {
	let span = options.span ?? [0, source.length];
	let separator = options.type === "hostname" ? "." : "/";
	let tokens = [];
	let optionals = /* @__PURE__ */ new Map();
	let appendText = (text) => {
		let currentToken = tokens.at(-1);
		if (currentToken?.type === "text") currentToken.text += text;
		else tokens.push({
			type: "text",
			text
		});
	};
	let i = span[0];
	let optionalStack = [];
	while (i < span[1]) {
		let char = source[i];
		if (char === "(") {
			optionalStack.push(tokens.length);
			tokens.push({ type: char });
			i += 1;
			continue;
		}
		if (char === ")") {
			let begin = optionalStack.pop();
			if (begin === void 0) throw new ParseError("unmatched )", source, i);
			optionals.set(begin, tokens.length);
			tokens.push({ type: char });
			i += 1;
			continue;
		}
		if (char === ":") {
			i += 1;
			let name = IDENTIFIER_RE.exec(source.slice(i, span[1]))?.[0];
			if (!name) throw new ParseError("missing variable name", source, i - 1);
			tokens.push({
				type: ":",
				name
			});
			i += name.length;
			continue;
		}
		if (char === "*") {
			i += 1;
			let name = IDENTIFIER_RE.exec(source.slice(i, span[1]))?.[0];
			tokens.push({
				type: "*",
				name: name ?? "*"
			});
			i += name?.length ?? 0;
			continue;
		}
		if (char === separator) {
			tokens.push({ type: "separator" });
			i += 1;
			continue;
		}
		if (char === "\\") {
			if (i + 1 === span[1]) throw new ParseError("dangling escape", source, i);
			appendText(source.slice(i + 1, i + 2));
			i += 2;
			continue;
		}
		appendText(char);
		i += 1;
	}
	if (optionalStack.length > 0) throw new ParseError("unmatched (", source, optionalStack.at(-1));
	return {
		tokens,
		optionals,
		type: options.type
	};
}
/** Error thrown when a route pattern cannot be parsed. */
var ParseError = class extends Error {
	/** The parse failure category. */
	type;
	/** Original pattern source being parsed. */
	source;
	/** Character index where parsing failed. */
	index;
	constructor(type, source, index) {
		let message = `${type}\n\n${source}\n${" ".repeat(index) + "^"}`;
		super(message);
		this.name = "ParseError";
		this.type = type;
		this.source = source;
		this.index = index;
	}
};
//#endregion
export { parsePart };
