import type { HydrationState, Router as DataRouter } from "../router/router";
import type { ServerHandoff } from "../server-runtime/serverHandoff";
import type { AssetsManifest } from "./ssr/entry";
import type { RouteModules } from "./ssr/routeModules";

export type WindowReactRouterContext = ServerHandoff & {
  state: HydrationState; // Deserialized via the stream
  stream: ReadableStream<Uint8Array> | undefined;
  streamController: ReadableStreamDefaultController<Uint8Array>;
};

export interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition(): void;
}

declare global {
  // TODO: v7 - Can this go away in favor of "just use remix"?
  var __staticRouterHydrationData: HydrationState | undefined;
  // v6 SPA info
  var __reactRouterVersion: string;
  interface Document {
    startViewTransition(cb: () => Promise<void> | void): ViewTransition;
  }
  var __reactRouterContext: WindowReactRouterContext | undefined;
  var __reactRouterManifest: AssetsManifest | undefined;
  var __reactRouterRouteModules: RouteModules | undefined;
  var __reactRouterDataRouter: DataRouter | undefined;
  var __reactRouterHdrActive: boolean;
  var $RefreshRuntime$:
    | {
        performReactRefresh: () => void;
      }
    | undefined;
}

// https://stackoverflow.com/a/59499895
export {};
