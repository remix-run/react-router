import type { RouteModules } from "../dom/ssr/routeModules";
import type { RSCRenderPayload, RSCRouteManifest } from "./server.rsc";

export function createRSCRouteModules(payload: RSCRenderPayload): RouteModules {
  const routeModules: RouteModules = {};
  for (const match of payload.matches) {
    populateRSCRouteModules(routeModules, match);
  }
  return routeModules;
}

export function populateRSCRouteModules(
  routeModules: RouteModules,
  matches: RSCRouteManifest | RSCRouteManifest[],
) {
  matches = Array.isArray(matches) ? matches : [matches];
  for (const match of matches) {
    routeModules[match.id] = {
      links: match.links,
      meta: match.meta,
      default: noopComponent,
    };
  }
}

const noopComponent = () => null;
