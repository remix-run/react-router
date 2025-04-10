export * from "react-router/client";

export { createStaticHandler } from "./lib/router/router";
export { data, matchRoutes } from "./lib/router/utils";

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
