
import { CookieParseOptions as CookieParseOptions$1, CookieSerializeOptions as CookieSerializeOptions$1 } from "cookie-es";

//#region lib/server-runtime/cookies.d.ts
interface CookieSignatureOptions {
  /**
   * An array of secrets that may be used to sign/unsign the value of a cookie.
   *
   * The array makes it easy to rotate secrets. New secrets should be added to
   * the beginning of the array. `cookie.serialize()` will always use the first
   * value in the array, but `cookie.parse()` may use any of them so that
   * cookies that were signed with older secrets still work.
   */
  secrets?: string[];
}
type CookieOptions = CookieParseOptions$1 & CookieSerializeOptions$1 & CookieSignatureOptions;
/**
 * A HTTP cookie.
 *
 * A Cookie is a logical container for metadata about a HTTP cookie; its name
 * and options. But it doesn't contain a value. Instead, it has `parse()` and
 * `serialize()` methods that allow a single instance to be reused for
 * parsing/encoding multiple different values.
 *
 * @see https://remix.run/utils/cookies#cookie-api
 */
interface Cookie {
  /**
   * The name of the cookie, used in the `Cookie` and `Set-Cookie` headers.
   */
  readonly name: string;
  /**
   * True if this cookie uses one or more secrets for verification.
   */
  readonly isSigned: boolean;
  /**
   * The Date this cookie expires.
   *
   * Note: This is calculated at access time using `maxAge` when no `expires`
   * option is provided to `createCookie()`.
   */
  readonly expires?: Date;
  /**
   * Parses a raw `Cookie` header and returns the value of this cookie or
   * `null` if it's not present.
   */
  parse(cookieHeader: string | null, options?: CookieParseOptions$1): Promise<any>;
  /**
   * Serializes the given value to a string and returns the `Set-Cookie`
   * header.
   */
  serialize(value: any, options?: CookieSerializeOptions$1): Promise<string>;
}
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
declare const createCookie: (name: string, cookieOptions?: CookieOptions) => Cookie;
/**
 * A function that determines whether a value is a React Router {@link Cookie}
 * object.
 *
 * @public
 * @category Utils
 * @mode framework
 * @mode data
 * @param object The value to check.
 * @returns `true` if the value is a React Router {@link Cookie} object;
 * otherwise, `false`.
 */
type IsCookieFunction = (object: any) => object is Cookie;
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
declare const isCookie: IsCookieFunction;
//#endregion
export { Cookie, CookieOptions, type CookieParseOptions$1 as CookieParseOptions, type CookieSerializeOptions$1 as CookieSerializeOptions, CookieSignatureOptions, IsCookieFunction, createCookie, isCookie };