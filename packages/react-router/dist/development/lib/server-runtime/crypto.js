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
//#region lib/server-runtime/crypto.ts
const encoder = /* @__PURE__ */ new TextEncoder();
const sign = async (value, secret) => {
	let data = encoder.encode(value);
	let key = await createKey(secret, ["sign"]);
	let signature = await crypto.subtle.sign("HMAC", key, data);
	let hash = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=+$/, "");
	return value + "." + hash;
};
const unsign = async (cookie, secret) => {
	let index = cookie.lastIndexOf(".");
	let value = cookie.slice(0, index);
	let hash = cookie.slice(index + 1);
	let data = encoder.encode(value);
	let key = await createKey(secret, ["verify"]);
	try {
		let signature = byteStringToUint8Array(atob(hash));
		return await crypto.subtle.verify("HMAC", key, signature, data) ? value : false;
	} catch (e) {
		return false;
	}
};
const createKey = async (secret, usages) => crypto.subtle.importKey("raw", encoder.encode(secret), {
	name: "HMAC",
	hash: "SHA-256"
}, false, usages);
function byteStringToUint8Array(byteString) {
	let array = new Uint8Array(byteString.length);
	for (let i = 0; i < byteString.length; i++) array[i] = byteString.charCodeAt(i);
	return array;
}
//#endregion
export { sign, unsign };
