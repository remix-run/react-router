import path from "pathe";
import type { RouteConfigEntry } from "../../routes";

const js = String.raw;

export function createVirtualRouteConfig({
  appDirectory,
  routeConfig,
}: {
  appDirectory: string;
  routeConfig: RouteConfigEntry[];
}): { code: string; routeIdByFile: Map<string, string> } {
  let routeIdByFile = new Map<string, string>();
  let code = js`import * as React from "react";
function frameworkRoute(lazy) {
  return async () => {
    const mod = await lazy();
    let Component;
    let Layout;
    let ErrorBoundary;
    let HydrateFallback;
    if ("default" in mod && mod.default) {
      if ("ServerComponent" in mod && mod.ServerComponent) {
        throw new Error("Module cannot have both a default export and a ServerComponent export");
      }
      Component = mod.default;
    } else if ("ServerComponent" in mod && mod.ServerComponent) {
      Component = mod.ServerComponent;
    }
    if ("Layout" in mod && mod.Layout) {
      if ("ServerLayout" in mod && mod.ServerLayout) {
        throw new Error("Module cannot have both a Layout export and a ServerLayout export");
      }
      Layout = mod.Layout;
    } else if ("ServerLayout" in mod && mod.ServerLayout) {
      Layout = mod.ServerLayout;
    }
    if ("ErrorBoundary" in mod && mod.ErrorBoundary) {
      if ("ServerErrorBoundary" in mod && mod.ServerErrorBoundary) {
        throw new Error(
          "Module cannot have both an ErrorBoundary export and a ServerErrorBoundary export",
        );
      }
      ErrorBoundary = mod.ErrorBoundary;
    } else if ("ServerErrorBoundary" in mod && mod.ServerErrorBoundary) {
      ErrorBoundary = mod.ServerErrorBoundary;
    }
    if ("HydrateFallback" in mod && mod.HydrateFallback) {
      if ("ServerHydrateFallback" in mod && mod.ServerHydrateFallback) {
        throw new Error(
          "Module cannot have both a HydrateFallback export and a ServerHydrateFallback export",
        );
      }
      HydrateFallback = mod.HydrateFallback;
    } else if ("ServerHydrateFallback" in mod && mod.ServerHydrateFallback) {
      HydrateFallback = mod.ServerHydrateFallback;
    }

    const {
      action,
      clientAction,
      clientLoader,
      clientMiddleware,
      handle,
      headers,
      links,
      loader,
      meta,
      middleware,
      shouldRevalidate,
    } = mod;

    return {
      Component,
      ErrorBoundary,
      HydrateFallback,
      Layout,
      action,
      clientAction,
      clientLoader,
      clientMiddleware,
      handle,
      headers,
      links,
      loader,
      meta,
      middleware,
      shouldRevalidate,
    };
  };
}
export default [`;

  const closeRouteSymbol = Symbol("CLOSE_ROUTE");
  let stack: Array<typeof closeRouteSymbol | RouteConfigEntry> = [
    ...routeConfig,
  ];
  while (stack.length > 0) {
    const route = stack.pop();
    if (!route) break;
    if (route === closeRouteSymbol) {
      code += "]},";
      continue;
    }

    code += "{";
    const routeFile = path.resolve(appDirectory, route.file);
    const routeId = route.id || createRouteId(route.file, appDirectory);
    routeIdByFile.set(routeFile, routeId);
    code += `lazy: frameworkRoute(() => import(${JSON.stringify(
      `${routeFile}`,
    )})),`;

    code += `id: ${JSON.stringify(routeId)},`;
    if (typeof route.path === "string") {
      code += `path: ${JSON.stringify(route.path)},`;
    }
    if (route.index) {
      code += `index: true,`;
    }
    if (route.caseSensitive) {
      code += `caseSensitive: true,`;
    }
    if (route.children) {
      code += ["children:["];
      stack.push(closeRouteSymbol);
      stack.push(...[...route.children].reverse());
    } else {
      code += "},";
    }
  }

  code += "];\n";

  return { code, routeIdByFile };
}

function createRouteId(file: string, appDirectory: string) {
  return path
    .relative(appDirectory, file)
    .replace(/\\+/, "/")
    .slice(0, -path.extname(file).length);
}
