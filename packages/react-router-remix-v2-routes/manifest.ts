import type { ConfigRoute } from "@react-router/dev/routes";

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

export function routeManifestToConfigRoutes(
  routeManifest: RouteManifest,
  rootId = "root"
): ConfigRoute[] {
  let configRoutes: {
    [id: string]: Omit<ConfigRoute, "id"> & Required<Pick<ConfigRoute, "id">>;
  } = {};

  for (let id in routeManifest) {
    let route = routeManifest[id];
    configRoutes[id] = {
      id: route.id,
      file: route.file,
      path: route.path,
      index: route.index,
      caseSensitive: route.caseSensitive,
    };
  }

  let rootRoutes: ConfigRoute[] = [];

  for (let id in configRoutes) {
    let route = configRoutes[id];
    let parentId = routeManifest[route.id].parentId;
    if (parentId === rootId) {
      rootRoutes.push(route);
    } else {
      let parentRoute = parentId && configRoutes[parentId];
      if (parentRoute) {
        parentRoute.children = parentRoute.children || [];
        parentRoute.children.push(route);
      }
    }
  }

  return rootRoutes;
}
