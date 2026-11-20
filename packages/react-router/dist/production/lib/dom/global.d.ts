
import { HydrationState, Router } from "../router/router.js";
import { RouteModules } from "./ssr/routeModules.js";
import { ServerHandoff } from "../server-runtime/serverHandoff.js";
import { AssetsManifest } from "./ssr/entry.js";

//#region lib/dom/global.d.ts
type WindowReactRouterContext = ServerHandoff & {
  state: HydrationState;
  stream: ReadableStream<Uint8Array> | undefined;
  streamController: ReadableStreamDefaultController<Uint8Array>;
};
interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition(): void;
}
declare global {
  var __staticRouterHydrationData: HydrationState | undefined;
  var __reactRouterVersion: string;
  interface Document {
    startViewTransition(cb: () => Promise<void> | void): ViewTransition;
  }
  var __reactRouterContext: WindowReactRouterContext | undefined;
  var __reactRouterManifest: AssetsManifest | undefined;
  var __reactRouterRouteModules: RouteModules | undefined;
  var __reactRouterDataRouter: Router | undefined;
  var __reactRouterHdrActive: boolean;
  var $RefreshRuntime$: {
    performReactRefresh: () => void;
  } | undefined;
}
//#endregion
export { WindowReactRouterContext };