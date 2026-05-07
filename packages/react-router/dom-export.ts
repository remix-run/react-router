/**
 * @module dom
 */

"use client";

export type { RouterProviderProps } from "./lib/dom-export/dom-router-provider";
export { RouterProvider } from "./lib/dom-export/dom-router-provider";
export type { HydratedRouterProps } from "./lib/dom-export/hydrated-router";
export { HydratedRouter } from "./lib/dom-export/hydrated-router";

// RSC
export {
  createCallServer as unstable_createCallServer,
  RSCHydratedRouter as unstable_RSCHydratedRouter,
} from "./lib/rsc/browser";
export { getRSCStream as unstable_getRSCStream } from "./lib/rsc/html-stream/browser";

export type {
  DecodeActionFunction as unstable_DecodeActionFunction,
  DecodeFormStateFunction as unstable_DecodeFormStateFunction,
  DecodeReplyFunction as unstable_DecodeReplyFunction,
  RSCManifestPayload as unstable_RSCManifestPayload,
  RSCPayload as unstable_RSCPayload,
  RSCRenderPayload as unstable_RSCRenderPayload,
} from "./lib/rsc/server.rsc";
