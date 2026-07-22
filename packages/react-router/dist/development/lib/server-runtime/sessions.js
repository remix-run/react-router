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
import { createCookie, isCookie } from "./cookies.js";
//#region lib/server-runtime/sessions.ts
function flash(name) {
	return `__flash_${name}__`;
}
/**
* Creates a new Session object.
*
* Note: This function is typically not invoked directly by application code.
* Instead, use a `SessionStorage` object's `getSession` method.
*
* @category Utils
* @param initialData The initial data for the session.
* @param id The identifier for the session. Defaults to an empty string for a
* new session.
* @returns A new {@link Session} object.
*/
const createSession = (initialData = {}, id = "") => {
	let map = new Map(Object.entries(initialData));
	return {
		get id() {
			return id;
		},
		get data() {
			return Object.fromEntries(map);
		},
		has(name) {
			return map.has(name) || map.has(flash(name));
		},
		get(name) {
			if (map.has(name)) return map.get(name);
			let flashName = flash(name);
			if (map.has(flashName)) {
				let value = map.get(flashName);
				map.delete(flashName);
				return value;
			}
		},
		set(name, value) {
			map.set(name, value);
		},
		flash(name, value) {
			map.set(flash(name), value);
		},
		unset(name) {
			map.delete(name);
		}
	};
};
/**
* Returns `true` if a value is a React Router {@link Session} object.
*
* @public
* @category Utils
* @mode framework
* @mode data
* @param object The value to check.
* @returns `true` if the value is a React Router {@link Session} object;
* otherwise, `false`.
*/
const isSession = (object) => {
	return object != null && typeof object.id === "string" && typeof object.data !== "undefined" && typeof object.has === "function" && typeof object.get === "function" && typeof object.set === "function" && typeof object.flash === "function" && typeof object.unset === "function";
};
/**
* Creates a SessionStorage object using a SessionIdStorageStrategy.
*
* Note: This is a low-level API that should only be used if none of the
* existing session storage options meet your requirements.
*
* @category Utils
* @param strategy The strategy used to store session identifiers and data.
* @returns A {@link SessionStorage} object that persists session data using the
* provided strategy.
*/
function createSessionStorage({ cookie: cookieArg, createData, readData, updateData, deleteData }) {
	let cookie = isCookie(cookieArg) ? cookieArg : createCookie(cookieArg?.name || "__session", cookieArg);
	warnOnceAboutSigningSessionCookie(cookie);
	return {
		async getSession(cookieHeader, options) {
			let id = cookieHeader && await cookie.parse(cookieHeader, options);
			return createSession(id && await readData(id) || {}, id || "");
		},
		async commitSession(session, options) {
			let { id, data } = session;
			let expires = options?.maxAge != null ? new Date(Date.now() + options.maxAge * 1e3) : options?.expires != null ? options.expires : cookie.expires;
			if (id) await updateData(id, data, expires);
			else id = await createData(data, expires);
			return cookie.serialize(id, options);
		},
		async destroySession(session, options) {
			await deleteData(session.id);
			return cookie.serialize("", {
				...options,
				maxAge: void 0,
				expires: /* @__PURE__ */ new Date(0)
			});
		}
	};
}
function warnOnceAboutSigningSessionCookie(cookie) {
	warnOnce(cookie.isSigned, `The "${cookie.name}" cookie is not signed, but session cookies should be signed to prevent tampering on the client before they are sent back to the server. See https://reactrouter.com/explanation/sessions-and-cookies#signing-cookies for more information.`);
}
//#endregion
export { createSession, createSessionStorage, isSession, warnOnceAboutSigningSessionCookie };
