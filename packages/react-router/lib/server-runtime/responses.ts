import {
  json as routerJson,
  redirect as routerRedirect,
  redirectDocument as routerRedirectDocument,
  replace as routerReplace,
} from "../router/utils";

export type JsonFunction = <Data>(
  data: Data,
  init?: number | ResponseInit
) => TypedResponse<Data>;

// must be a type since this is a subtype of response
// interfaces must conform to the types they extend
export type TypedResponse<T = unknown> = Omit<Response, "json"> & {
  json(): Promise<T>;
};

/**
 * This is a shortcut for creating `application/json` responses. Converts `data`
 * to JSON and sets the `Content-Type` header.
 *
 * @see https://remix.run/utils/json
 */
export const json: JsonFunction = (data, init = {}) => {
  return routerJson(data, init);
};

export type RedirectFunction = (
  url: string,
  init?: number | ResponseInit
) => TypedResponse<never>;

/**
 * A redirect response. Sets the status code and the `Location` header.
 * Defaults to "302 Found".
 *
 * @see https://remix.run/utils/redirect
 */
export const redirect: RedirectFunction = (url, init = 302) => {
  return routerRedirect(url, init) as TypedResponse<never>;
};

/**
 * A redirect response that will force a document reload to the new location.
 * Sets the status code and the `Location` header.
 * Defaults to "302 Found".
 *
 * @see https://remix.run/utils/redirect
 */
export const redirectDocument: RedirectFunction = (url, init = 302) => {
  return routerRedirectDocument(url, init) as TypedResponse<never>;
};

/**
 * A redirect response. Sets the status code and the `Location` header.
 * Defaults to "302 Found".
 *
 * @see https://remix.run/utils/redirect
 */
export const replace: RedirectFunction = (url, init = 302) => {
  return routerReplace(url, init) as TypedResponse<never>;
};

export function isResponse(value: any): value is Response {
  return (
    value != null &&
    typeof value.status === "number" &&
    typeof value.statusText === "string" &&
    typeof value.headers === "object" &&
    typeof value.body !== "undefined"
  );
}

const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);
export function isRedirectStatusCode(statusCode: number): boolean {
  return redirectStatusCodes.has(statusCode);
}
export function isRedirectResponse(response: Response): boolean {
  return isRedirectStatusCode(response.status);
}
