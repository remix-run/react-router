import path from "node:path";
import type { RouteConfigEntry } from "../../routes";

export function createVirtualRouteConfig({
  appDirectory,
  routeConfig,
}: {
  appDirectory: string;
  routeConfig: RouteConfigEntry[];
}): { code: string; routeIdByFile: Map<string, string> } {
  let routeIdByFile = new Map<string, string>();
  let code = "export default [";

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
    code += `lazy: () => import(${JSON.stringify(
      `${routeFile}?route-module${routeId === "root" ? "&root-route=true" : ""}`,
    )}),`;

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
