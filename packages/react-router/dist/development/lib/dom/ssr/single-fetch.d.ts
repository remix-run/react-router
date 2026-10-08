
import { DataStrategyFunction } from "../../router/utils.js";
import { Router } from "../../router/router.js";
import { RouteModules } from "./routeModules.js";
import { AssetsManifest } from "./entry.js";
//#region lib/dom/ssr/single-fetch.d.ts
declare const SingleFetchRedirectSymbol: unique symbol;
declare function getTurboStreamSingleFetchDataStrategy(getRouter: () => Router, manifest: AssetsManifest, routeModules: RouteModules, ssr: boolean): DataStrategyFunction;
declare function decodeViaTurboStream(body: ReadableStream<Uint8Array>, global: Window | typeof globalThis): Promise<{
  done: Promise<void>;
  value: unknown;
}>;
//#endregion
export { SingleFetchRedirectSymbol, decodeViaTurboStream, getTurboStreamSingleFetchDataStrategy };