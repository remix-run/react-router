import type { Location } from "../router/history";

// Shared across the main and DOM entry bundles via the global symbol registry.
const SPA_HYDRATION_LOCATION = Symbol.for("react-router.spaHydrationLocation");

export function setSpaHydrationLocation(router: object, location: Location) {
  (router as any)[SPA_HYDRATION_LOCATION] = location;
}

export function takeSpaHydrationLocation(router: object): Location | undefined {
  let location = (router as any)[SPA_HYDRATION_LOCATION] as
    | Location
    | undefined;
  if (location) {
    delete (router as any)[SPA_HYDRATION_LOCATION];
  }
  return location;
}

/**
 * SPA fallback HTML is rendered for `spaLocation` and then served for other
 * URLs. React does not patch attribute mismatches during hydration, so the
 * first client render has to use the prerendered location. A follow-up render
 * with the real location updates things like `NavLink`'s active class.
 */
export function getSpaHydrationLocation(
  routerLocation: Location,
  spaLocation: { pathname: string; search: string; hash: string } | undefined,
): Location | null {
  if (
    !spaLocation ||
    (routerLocation.pathname === spaLocation.pathname &&
      routerLocation.search === spaLocation.search &&
      routerLocation.hash === spaLocation.hash)
  ) {
    return null;
  }

  return {
    pathname: spaLocation.pathname,
    search: spaLocation.search,
    hash: spaLocation.hash,
    state: null,
    key: routerLocation.key,
  };
}
