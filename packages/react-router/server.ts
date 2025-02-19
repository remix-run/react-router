export { createStaticHandler } from "./lib/router/router";
export { matchRoutes } from "./lib/router/utils";

export type {
  ServerMatch,
  ServerPayload,
  ServerRouteMatch,
  ServerRouteObject,
} from "./lib/server";
export {
  isReactServerRequest,
  matchServerRequest,
  routeServerRequest,
} from "./lib/server";
