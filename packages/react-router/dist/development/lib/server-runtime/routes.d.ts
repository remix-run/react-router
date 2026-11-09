
import { RouteManifest } from "../router/utils.js";
import { Route } from "../dom/ssr/routes.js";
import { ServerRouteModule } from "../dom/ssr/routeModules.js";

//#region lib/server-runtime/routes.d.ts
type ServerRouteManifest = RouteManifest<Omit<ServerRoute, "children">>;
interface ServerRoute extends Route {
  children: ServerRoute[];
  module: ServerRouteModule;
}
//#endregion
export { ServerRouteManifest };