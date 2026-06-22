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
//#region lib/actions.ts
function throwIfPotentialCSRFAttack(request, allowedActionOrigins) {
	let originHeader = request.headers.get("origin");
	let originDomain = null;
	try {
		originDomain = typeof originHeader === "string" && originHeader !== "null" ? new URL(originHeader).host : originHeader;
	} catch {
		throw new Error(`\`origin\` header is not a valid URL. Aborting the action.`);
	}
	let host = new URL(request.url).host;
	if (originDomain && originDomain !== host) {
		if (!isAllowedOrigin(originDomain, allowedActionOrigins)) throw new Error("The `request.url` host does not match `origin` header from a forwarded action request. Aborting the action.");
	}
}
function matchWildcardDomain(domain, pattern) {
	const domainParts = domain.split(".");
	const patternParts = pattern.split(".");
	if (patternParts.length < 1) return false;
	if (domainParts.length < patternParts.length) return false;
	while (patternParts.length) {
		const patternPart = patternParts.pop();
		const domainPart = domainParts.pop();
		switch (patternPart) {
			case "": return false;
			case "*": if (domainPart) continue;
			else return false;
			case "**":
				if (patternParts.length > 0) return false;
				return domainPart !== void 0;
			case void 0:
			default: if (domainPart !== patternPart) return false;
		}
	}
	return domainParts.length === 0;
}
function isAllowedOrigin(originDomain, allowedActionOrigins = []) {
	return allowedActionOrigins.some((allowedOrigin) => allowedOrigin && (allowedOrigin === originDomain || matchWildcardDomain(originDomain, allowedOrigin)));
}
//#endregion
export { throwIfPotentialCSRFAttack };
