import type { RouteConfigEntry } from "@react-router/dev/routes";

export interface RouteManifestEntry {
  path?: string;
  index?: boolean;
  caseSensitive?: boolean;
  id: string;
  parentId?: string;
  file: string;
}

export interface RouteManifest {
  [routeId: string]: RouteManifestEntry;
}

export function routeManifestToRouteConfig(
  routeManifest: RouteManifest,
  rootId = "root"
): RouteConfigEntry[] {
  let routeConfigById: {
    [id: string]: Omit<RouteConfigEntry, "id"> &
      Required<Pick<RouteConfigEntry, "id">>;
  } = {};

  for (let id in routeManifest) {
    let route = routeManifest[id];
    routeConfigById[id] = {
      id: route.id,
      file: route.file,
      path: route.path,
      index: route.index,
      caseSensitive: route.caseSensitive,
    };
  }

  let routeConfig: RouteConfigEntry[] = [];

  for (let id in routeConfigById) {
    let route = routeConfigById[id];
    let parentId = routeManifest[route.id].parentId;
    if (parentId === rootId) {
      routeConfig.push(route);
    } else {
      let parentRoute = parentId && routeConfigById[parentId];
      if (parentRoute) {
        parentRoute.children = parentRoute.children || [];
        parentRoute.children.push(route);
      }
    }
  }

  return routeConfig;
}
