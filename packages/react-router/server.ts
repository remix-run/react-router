export { createStaticHandler } from "./lib/router/router";
export { data, matchRoutes } from "./lib/router/utils";

export type {
  DecodeCallServerFunction,
  ServerManifestPayload,
  ServerMatch,
  ServerPayload,
  ServerRenderPayload,
  RenderedRoute as ServerRouteManifest,
  ServerRouteMatch,
  ServerRouteObject,
} from "./lib/server";
export {
  isReactServerRequest,
  matchServerRequest,
  routeServerRequest,
} from "./lib/server";
