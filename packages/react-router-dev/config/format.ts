import type { RouteManifest } from "./routes";

export type RoutesFormat = "json" | "jsx";

export function formatRoutes(
  routeManifest: RouteManifest,
  format: RoutesFormat
) {
  switch (format) {
    case "json":
      return formatRoutesAsJson(routeManifest);
    case "jsx":
      return formatRoutesAsJsx(routeManifest);
  }
}

type JsonFormattedRoute = {
  id: string;
  index?: boolean | undefined;
  path?: string | undefined;
  caseSensitive?: boolean | undefined;
  file: string;
  children?: JsonFormattedRoute[] | undefined;
};

export function formatRoutesAsJson(routeManifest: RouteManifest): string {
  function handleRoutesRecursive(
    parentId?: string | undefined
  ): JsonFormattedRoute[] | undefined {
    const routes = Object.values(routeManifest).filter(
      (route) => route.parentId === parentId
    );

    let children = [];

    for (const route of routes) {
      children.push({
        id: route.id,
        index: route.index,
        path: route.path,
        caseSensitive: route.caseSensitive,
        file: route.file,
        children: handleRoutesRecursive(route.id),
      });
    }

    if (children.length > 0) {
      return children;
    }
    return undefined;
  }

  return JSON.stringify(handleRoutesRecursive() || null, null, 2);
}

export function formatRoutesAsJsx(routeManifest: RouteManifest) {
  let output = "<Routes>";

  function handleRoutesRecursive(
    parentId?: string | undefined,
    level = 1
  ): boolean {
    const routes = Object.values(routeManifest).filter(
      (route) => route.parentId === parentId
    );

    const indent = Array(level * 2)
      .fill(" ")
      .join("");

    for (const route of routes) {
      output += "\n" + indent;
      output += `<Route${
        route.path ? ` path=${JSON.stringify(route.path)}` : ""
      }${route.index ? " index" : ""}${
        route.file ? ` file=${JSON.stringify(route.file)}` : ""
      }>`;
      if (handleRoutesRecursive(route.id, level + 1)) {
        output += "\n" + indent;
        output += "</Route>";
      } else {
        output = output.slice(0, -1) + " />";
      }
    }

    return routes.length > 0;
  }

  handleRoutesRecursive();

  output += "\n</Routes>";

  return output;
}
