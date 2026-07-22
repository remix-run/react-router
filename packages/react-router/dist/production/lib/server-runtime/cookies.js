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
import { warnOnce } from "./warnings.js";
import { sign, unsign } from "./crypto.js";
import { parse, serialize } from "cookie-es";
//#region lib/server-runtime/cookies.ts
/**
* Creates a logical container for managing a browser cookie from the server.
*
* @public
* @category Utils
* @mode framework
* @mode data
* @param name The name of the cookie.
* @param cookieOptions Options for parsing and serializing the cookie.
* @returns A {@link Cookie} object for parsing and serializing the cookie.
*/
const createCookie = (name, cookieOptions = {}) => {
	let { secrets = [], ...options } = {
		path: "/",
		sameSite: "lax",
		...cookieOptions
	};
	warnOnceAboutExpiresCookie(name, options.expires);
	return {
		get name() {
			return name;
		},
		get isSigned() {
			return secrets.length > 0;
		},
		get expires() {
			return typeof options.maxAge !== "undefined" ? new Date(Date.now() + options.maxAge * 1e3) : options.expires;
		},
		async parse(cookieHeader, parseOptions) {
			if (!cookieHeader) return null;
			let cookies = parse(cookieHeader, {
				...options,
				...parseOptions
			});
			if (name in cookies) {
				let value = cookies[name];
				if (typeof value === "string" && value !== "") return await decodeCookieValue(value, secrets);
				else return "";
			} else return null;
		},
		async serialize(value, serializeOptions) {
			return serialize(name, value === "" ? "" : await encodeCookieValue(value, secrets), {
				...options,
				...serializeOptions
			});
		}
	};
};
/**
* Returns `true` if a value is a React Router {@link Cookie} object.
*
* @public
* @category Utils
* @mode framework
* @mode data
* @param object The value to check.
* @returns `true` if the value is a React Router {@link Cookie} object;
* otherwise, `false`.
*/
const isCookie = (object) => {
	return object != null && typeof object.name === "string" && typeof object.isSigned === "boolean" && typeof object.parse === "function" && typeof object.serialize === "function";
};
async function encodeCookieValue(value, secrets) {
	let encoded = encodeData(value);
	if (secrets.length > 0) encoded = await sign(encoded, secrets[0]);
	return encoded;
}
async function decodeCookieValue(value, secrets) {
	if (secrets.length > 0) {
		for (let secret of secrets) {
			let unsignedValue = await unsign(value, secret);
			if (unsignedValue !== false) return decodeData(unsignedValue);
		}
		return null;
	}
	return decodeData(value);
}
function encodeData(value) {
	return btoa(myUnescape(encodeURIComponent(JSON.stringify(value))));
}
function decodeData(value) {
	try {
		return JSON.parse(decodeURIComponent(myEscape(atob(value))));
	} catch (e) {
		return {};
	}
}
function myEscape(value) {
	let str = value.toString();
	let result = "";
	let index = 0;
	let chr, code;
	while (index < str.length) {
		chr = str.charAt(index++);
		if (/[\w*+\-./@]/.exec(chr)) result += chr;
		else {
			code = chr.charCodeAt(0);
			if (code < 256) result += "%" + hex(code, 2);
			else result += "%u" + hex(code, 4).toUpperCase();
		}
	}
	return result;
}
function hex(code, length) {
	let result = code.toString(16);
	while (result.length < length) result = "0" + result;
	return result;
}
function myUnescape(value) {
	let str = value.toString();
	let result = "";
	let index = 0;
	let chr, part;
	while (index < str.length) {
		chr = str.charAt(index++);
		if (chr === "%") if (str.charAt(index) === "u") {
			part = str.slice(index + 1, index + 5);
			if (/^[\da-f]{4}$/i.exec(part)) {
				result += String.fromCharCode(parseInt(part, 16));
				index += 5;
				continue;
			}
		} else {
			part = str.slice(index, index + 2);
			if (/^[\da-f]{2}$/i.exec(part)) {
				result += String.fromCharCode(parseInt(part, 16));
				index += 2;
				continue;
			}
		}
		result += chr;
	}
	return result;
}
function warnOnceAboutExpiresCookie(name, expires) {
	warnOnce(!expires, `The "${name}" cookie has an "expires" property set. This will cause the expires value to not be updated when the session is committed. Instead, you should set the expires value when serializing the cookie. You can use \`commitSession(session, { expires })\` if using a session storage object, or \`cookie.serialize("value", { expires })\` if you're using the cookie directly.`);
}
//#endregion
export { createCookie, isCookie };
