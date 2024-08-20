import type { RoutesConfigEntry } from "@react-router/dev/routes";

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

export function routeManifestToRoutesConfig(
  routeManifest: RouteManifest,
  rootId = "root"
): RoutesConfigEntry[] {
  let routesConfigById: {
    [id: string]: Omit<RoutesConfigEntry, "id"> &
      Required<Pick<RoutesConfigEntry, "id">>;
  } = {};

  for (let id in routeManifest) {
    let route = routeManifest[id];
    routesConfigById[id] = {
      id: route.id,
      file: route.file,
      path: route.path,
      index: route.index,
      caseSensitive: route.caseSensitive,
    };
  }

  let routesConfig: RoutesConfigEntry[] = [];

  for (let id in routesConfigById) {
    let route = routesConfigById[id];
    let parentId = routeManifest[route.id].parentId;
    if (parentId === rootId) {
      routesConfig.push(route);
    } else {
      let parentRoute = parentId && routesConfigById[parentId];
      if (parentRoute) {
        parentRoute.children = parentRoute.children || [];
        parentRoute.children.push(route);
      }
    }
  }

  return routesConfig;
}
