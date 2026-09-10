
import { FormEncType, HTMLFormMethod } from "../router/utils.js";
import { RelativeRoutingType } from "../router/router.js";

//#region lib/dom/dom.d.ts
type ParamKeyValuePair = [string, string];
type URLSearchParamsInit = string | ParamKeyValuePair[] | Record<string, string | string[]> | URLSearchParams;
/**
 * Creates a URLSearchParams object using the given initializer.
 *
 * This is identical to `new URLSearchParams(init)` except it also supports
 * arrays as values in the object form of the initializer instead of just
 * strings. This is convenient when you need multiple values for a given key,
 * but don't want to use an array initializer.
 *
 * @example
 * // Instead of:
 * let searchParams = new URLSearchParams([
 *   ["sort", "name"],
 *   ["sort", "price"],
 * ]);
 *
 * // You can do:
 * let searchParams = createSearchParams({
 *   sort: ["name", "price"],
 * });
 *
 * @public
 * @category Utils
 * @param init The value used to initialize the URL search parameters.
 * @returns A URLSearchParams object containing the initialized search
 * parameters.
 */
declare function createSearchParams(init?: URLSearchParamsInit): URLSearchParams;
type JsonObject = { [Key in string]: JsonValue } & { [Key in string]?: JsonValue | undefined };
type JsonArray = JsonValue[] | readonly JsonValue[];
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
type SubmitTarget = HTMLFormElement | HTMLButtonElement | HTMLInputElement | FormData | URLSearchParams | JsonValue | null;
/**
 * Submit options shared by both navigations and fetchers
 */
interface SharedSubmitOptions {
  /**
   * The HTTP method used to submit the form. Overrides `<form method>`.
   * Defaults to "GET".
   */
  method?: HTMLFormMethod;
  /**
   * The action URL path used to submit the form. Overrides `<form action>`.
   * Defaults to the path of the current route.
   */
  action?: string;
  /**
   * The encoding used to submit the form. Overrides `<form encType>`.
   * Defaults to "application/x-www-form-urlencoded".
   */
  encType?: FormEncType;
  /**
   * Determines whether the form action is relative to the route hierarchy or
   * the pathname.  Use this if you want to opt out of navigating the route
   * hierarchy and want to instead route based on /-delimited URL segments
   */
  relative?: RelativeRoutingType;
  /**
   * In browser-based environments, prevent resetting scroll after this
   * navigation when using the <ScrollRestoration> component
   */
  preventScrollReset?: boolean;
  /**
   * Enable flushSync for this submission's state updates
   */
  flushSync?: boolean;
  /**
   * Specify the default revalidation behavior after this submission
   *
   * If no `shouldRevalidate` functions are present on the active routes, then this
   * value will be used directly.  Otherwise it will be passed into `shouldRevalidate`
   * so the route can make the final determination on revalidation. This can be
   * useful when updating search params and you don't want to trigger a revalidation.
   *
   * By default (when not specified), loaders will revalidate according to the routers
   * standard revalidation behavior.
   */
  defaultShouldRevalidate?: boolean;
}
/**
 * Submit options available to fetchers
 */
interface FetcherSubmitOptions extends SharedSubmitOptions {}
/**
 * Submit options available to navigations
 */
interface SubmitOptions extends FetcherSubmitOptions {
  /**
   * Set `true` to replace the current entry in the browser's history stack
   * instead of creating a new one (i.e. stay on "the same page"). Defaults
   * to `false`.
   */
  replace?: boolean;
  /**
   * State object to add to the history stack entry for this navigation
   */
  state?: any;
  /**
   * Indicate a specific fetcherKey to use when using navigate=false
   */
  fetcherKey?: string;
  /**
   * navigate=false will use a fetcher instead of a navigation
   */
  navigate?: boolean;
  /**
   * Enable view transitions on this submission navigation
   */
  viewTransition?: boolean;
}
//#endregion
export { FetcherSubmitOptions, ParamKeyValuePair, SubmitOptions, SubmitTarget, URLSearchParamsInit, createSearchParams };