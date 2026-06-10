/**
 * react-router v8.0.0-pre.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
//#region lib/actions.ts
function throwIfPotentialCSRFAttack(headers, allowedActionOrigins) {
	let originHeader = headers.get("origin");
	let originDomain = null;
	try {
		originDomain = typeof originHeader === "string" && originHeader !== "null" ? new URL(originHeader).host : originHeader;
	} catch {
		throw new Error(`\`origin\` header is not a valid URL. Aborting the action.`);
	}
	let host = parseHostHeader(headers);
	if (originDomain && (!host || originDomain !== host.value)) {
		if (!isAllowedOrigin(originDomain, allowedActionOrigins)) if (host) throw new Error(`${host.type} header does not match \`origin\` header from a forwarded action request. Aborting the action.`);
		else throw new Error("`x-forwarded-host` or `host` headers are not provided. One of these is needed to compare the `origin` header from a forwarded action request. Aborting the action.");
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
function parseHostHeader(headers) {
	let forwardedHostValue = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
	let hostHeader = headers.get("host");
	return forwardedHostValue ? {
		type: "x-forwarded-host",
		value: forwardedHostValue
	} : hostHeader ? {
		type: "host",
		value: hostHeader
	} : void 0;
}
//#endregion
export { throwIfPotentialCSRFAttack };
