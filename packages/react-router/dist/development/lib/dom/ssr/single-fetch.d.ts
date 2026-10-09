
import { Action } from "../../router/history.js";
import { DataStrategyFunction } from "../../router/utils.js";
import { Router } from "../../router/router.js";
import { RouteModules } from "./routeModules.js";
import { AssetsManifest } from "./entry.js";
//#region lib/dom/ssr/single-fetch.d.ts
declare const SingleFetchRedirectSymbol: unique symbol;
/**
 * Describes the operation that initiated an internal router request.
 *
 * Requests that reload fetchers as part of a navigation, revalidation, or
 * initialization redirect keep that initiating `type`. `fetcherKey` identifies
 * the fetcher being loaded, or is `null` when the request targets route loaders
 * or actions.
 *
 * `navigationType` is the history action (`"PUSH"`, `"REPLACE"`, or `"POP"`)
 * for navigation-initiated data requests, including reloaded fetchers. It is
 * `null` for initialization, fetcher, and revalidation requests. Manifest
 * requests have no navigation type.
 */
type RouterFetchContext = {
  type: "manifest";
} | {
  type: "navigation";
  fetcherKey: string | null;
  navigationType: Action;
} | {
  type: "initialization" | "fetcher" | "revalidation";
  fetcherKey: string | null;
  navigationType: null;
};
type RouterFetch = (request: Request, context: RouterFetchContext) => Promise<Response>;
declare function getTurboStreamSingleFetchDataStrategy(getRouter: () => Router, manifest: AssetsManifest, routeModules: RouteModules, ssr: boolean, fetchImplementation: RouterFetch, isApiOnly?: boolean, serverOrigin?: string): DataStrategyFunction;
declare function decodeViaTurboStream(body: ReadableStream<Uint8Array>, global: Window | typeof globalThis): Promise<{
  done: Promise<void>;
  value: unknown;
}>;
//#endregion
export { RouterFetch, RouterFetchContext, SingleFetchRedirectSymbol, decodeViaTurboStream, getTurboStreamSingleFetchDataStrategy };