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
import { createCookie, isCookie } from "../cookies.js";
import { createSession, warnOnceAboutSigningSessionCookie } from "../sessions.js";
//#region lib/server-runtime/sessions/cookieStorage.ts
/**
* Creates and returns a SessionStorage object that stores all session data
* directly in the session cookie itself.
*
* This has the advantage that no database or other backend services are
* needed, and can help to simplify some load-balanced scenarios. However, it
* also has the limitation that serialized session data may not exceed the
* browser's maximum cookie size. Trade-offs!
*
* @public
* @category Utils
* @mode framework
* @mode data
* @param options Options for creating the cookie-backed session storage.
* @returns A {@link SessionStorage} object that stores all session data in its
* cookie.
*/
function createCookieSessionStorage({ cookie: cookieArg } = {}) {
	let cookie = isCookie(cookieArg) ? cookieArg : createCookie(cookieArg?.name || "__session", cookieArg);
	warnOnceAboutSigningSessionCookie(cookie);
	return {
		async getSession(cookieHeader, options) {
			return createSession(cookieHeader && await cookie.parse(cookieHeader, options) || {});
		},
		async commitSession(session, options) {
			let serializedCookie = await cookie.serialize(session.data, options);
			if (serializedCookie.length > 4096) throw new Error("Cookie length will exceed browser maximum. Length: " + serializedCookie.length);
			return serializedCookie;
		},
		async destroySession(_session, options) {
			return cookie.serialize("", {
				...options,
				maxAge: void 0,
				expires: /* @__PURE__ */ new Date(0)
			});
		}
	};
}
//#endregion
export { createCookieSessionStorage };
