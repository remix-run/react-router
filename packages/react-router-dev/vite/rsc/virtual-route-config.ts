import path from "node:path";
import type { RouteConfigEntry } from "../../routes";

export function createVirtualRouteConfigCode({
  appDirectory,
  routeConfig,
}: {
  appDirectory: string;
  routeConfig: RouteConfigEntry[];
}) {
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
    code += `lazy: () => import(${JSON.stringify(
      `${path.resolve(appDirectory, route.file)}?route-module${
        route.id === "root" ? "&root-route=true" : ""
      }`,
    )}),`;

    code += `id: ${JSON.stringify(
      route.id || createRouteId(route.file, appDirectory),
    )},`;
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

  return code;
}

function createRouteId(file: string, appDirectory: string) {
  return path
    .relative(appDirectory, file)
    .replace(/\\+/, "/")
    .slice(0, -path.extname(file).length);
}
