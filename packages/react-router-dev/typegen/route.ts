import type { RouteManifest, RouteManifestEntry } from "../config/routes";

export function lineage(
  routes: RouteManifest,
  route: RouteManifestEntry
): RouteManifestEntry[] {
  const result: RouteManifestEntry[] = [];
  while (route) {
    result.push(route);
    if (!route.parentId) break;
    route = routes[route.parentId];
  }
  result.reverse();
  return result;
}

export function fullpath(lineage: RouteManifestEntry[]) {
  const route = lineage.at(-1);

  // root
  if (lineage.length === 1 && route?.id === "root") return "/";

  // layout
  const isLayout = route && route.index !== true && route.path === undefined;
  if (isLayout) return undefined;

  return (
    "/" +
    lineage
      .map((route) => route.path?.replace(/^\//, "")?.replace(/\/$/, ""))
      .filter((path) => path !== undefined && path !== "")
      .join("/")
  );
}
