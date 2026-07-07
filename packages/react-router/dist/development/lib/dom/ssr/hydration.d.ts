
import { Path } from "../../router/history.js";
import { DataRouteObject } from "../../router/utils.js";
import { HydrationState, Router } from "../../router/router.js";
import { ClientLoaderFunction } from "./routeModules.js";

//#region lib/dom/ssr/hydration.d.ts
declare function getHydrationData({
  state,
  routes,
  getRouteInfo,
  location,
  basename,
  isSpaMode
}: {
  state: {
    loaderData?: Router["state"]["loaderData"];
    actionData?: Router["state"]["actionData"];
    errors?: Router["state"]["errors"];
  };
  routes: DataRouteObject[];
  getRouteInfo: (routeId: string) => {
    clientLoader: ClientLoaderFunction | undefined;
    hasLoader: boolean;
    hasHydrateFallback: boolean;
  };
  location: Path;
  basename: string | undefined;
  isSpaMode: boolean;
}): HydrationState;
//#endregion
export { getHydrationData };