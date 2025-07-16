import type { DataRouteObject } from "../../context";
import type { Path } from "../../router/history";
import type { Router as DataRouter, HydrationState } from "../../router/router";
import { matchRoutes } from "../../router/utils";
import type { ClientLoaderFunction } from "./routeModules";
import { shouldHydrateRouteLoader } from "./routes";

export function getHydrationData(
  state: {
    loaderData?: DataRouter["state"]["loaderData"];
    actionData?: DataRouter["state"]["actionData"];
    errors?: DataRouter["state"]["errors"];
  },
  routes: DataRouteObject[],
  getRouteInfo: (routeId: string) => {
    clientLoader: ClientLoaderFunction | undefined;
    hasLoader: boolean;
    hasHydrateFallback: boolean;
  },
  location: Path,
  basename: string | undefined,
  isSpaMode: boolean,
): HydrationState {
  // Create a shallow clone of `loaderData` we can mutate for partial hydration.
  // When a route exports a `clientLoader` and a `HydrateFallback`, the SSR will
  // render the fallback so we need the client to do the same for hydration.
  // The server loader data has already been exposed to these route `clientLoader`'s
  // in `createClientRoutes` above, so we need to clear out the version we pass to
  // `createBrowserRouter` so it initializes and runs the client loaders.
  let hydrationData = {
    ...state,
    loaderData: { ...state.loaderData },
  };
  let initialMatches = matchRoutes(routes, location, basename);
  if (initialMatches) {
    for (let match of initialMatches) {
      let routeId = match.route.id;
      let routeInfo = getRouteInfo(routeId);
      // Clear out the loaderData to avoid rendering the route component when the
      // route opted into clientLoader hydration and either:
      // * gave us a HydrateFallback
      // * or doesn't have a server loader and we have no data to render
      if (
        shouldHydrateRouteLoader(
          routeId,
          routeInfo.clientLoader,
          routeInfo.hasLoader,
          isSpaMode,
        ) &&
        (routeInfo.hasHydrateFallback || !routeInfo.hasLoader)
      ) {
        delete hydrationData.loaderData![routeId];
      } else if (!routeInfo.hasLoader) {
        // Since every Remix route gets a `loader` on the client side to load
        // the route JS module, we need to add a `null` value to `loaderData`
        // for any routes that don't have server loaders so our partial
        // hydration logic doesn't kick off the route module loaders during
        // hydration
        hydrationData.loaderData![routeId] = null;
      }
    }
  }

  return hydrationData;
}
