import type { CreateCookieFunction } from "../cookies";
import { isCookie } from "../cookies";
import type {
  SessionStorage,
  SessionIdStorageStrategy,
  SessionData,
} from "../sessions";
import { warnOnceAboutSigningSessionCookie, createSession } from "../sessions";

interface CookieSessionStorageOptions {
  /**
   * The Cookie used to store the session data on the client, or options used
   * to automatically create one.
   */
  cookie?: SessionIdStorageStrategy["cookie"];
}

export type CreateCookieSessionStorageFunction = <
  Data = SessionData,
  FlashData = Data
>(
  options?: CookieSessionStorageOptions
) => SessionStorage<Data, FlashData>;

/**
 * Creates and returns a SessionStorage object that stores all session data
 * directly in the session cookie itself.
 *
 * This has the advantage that no database or other backend services are
 * needed, and can help to simplify some load-balanced scenarios. However, it
 * also has the limitation that serialized session data may not exceed the
 * browser's maximum cookie size. Trade-offs!
 *
 * @see https://remix.run/utils/sessions#createcookiesessionstorage
 */
export const createCookieSessionStorageFactory =
  (createCookie: CreateCookieFunction): CreateCookieSessionStorageFunction =>
  ({ cookie: cookieArg } = {}) => {
    let cookie = isCookie(cookieArg)
      ? cookieArg
      : createCookie(cookieArg?.name || "__session", cookieArg);

    warnOnceAboutSigningSessionCookie(cookie);

    return {
      async getSession(cookieHeader, options) {
        return createSession(
          (cookieHeader && (await cookie.parse(cookieHeader, options))) || {}
        );
      },
      async commitSession(session, options) {
        let serializedCookie = await cookie.serialize(session.data, options);
        if (serializedCookie.length > 4096) {
          throw new Error(
            "Cookie length will exceed browser maximum. Length: " +
              serializedCookie.length
          );
        }
        return serializedCookie;
      },
      async destroySession(_session, options) {
        return cookie.serialize("", {
          ...options,
          maxAge: undefined,
          expires: new Date(0),
        });
      },
    };
  };
