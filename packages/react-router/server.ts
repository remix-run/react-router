export { createStaticHandler } from "./lib/router/router";
export {
  data,
  matchRoutes,
  redirect,
  redirectDocument,
  replace,
} from "./lib/router/utils";

export type {
  DecodeCallServerFunction,
  DecodeFormActionFunction,
  ServerManifestPayload,
  ServerMatch,
  ServerPayload,
  ServerRenderPayload,
  RenderedRoute as ServerRouteManifest,
  ServerRouteMatch,
  ServerRouteObject,
} from "./lib/server";
export { isReactServerRequest, matchServerRequest } from "./lib/server";
