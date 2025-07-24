import * as babel from "../babel";
import { parse as esModuleLexer } from "es-module-lexer";
import { removeExports } from "../remove-exports";

const SERVER_ONLY_ROUTE_EXPORTS = [
  "loader",
  "action",
  "unstable_middleware",
  "headers",
  "ServerComponent",
] as const;

const COMPONENT_EXPORTS = [
  "default",
  "ErrorBoundary",
  "HydrateFallback",
  "Layout",
] as const;

const CLIENT_NON_COMPONENT_EXPORTS = [
  "clientAction",
  "clientLoader",
  "unstable_clientMiddleware",
  "handle",
  "meta",
  "links",
  "shouldRevalidate",
] as const;
type ClientNonComponentExport = (typeof CLIENT_NON_COMPONENT_EXPORTS)[number];
const CLIENT_NON_COMPONENT_EXPORTS_SET = new Set(CLIENT_NON_COMPONENT_EXPORTS);
function isClientNonComponentExport(
  name: string,
): name is ClientNonComponentExport {
  return CLIENT_NON_COMPONENT_EXPORTS_SET.has(name as ClientNonComponentExport);
}

const CLIENT_ROUTE_EXPORTS = [
  ...CLIENT_NON_COMPONENT_EXPORTS,
  ...COMPONENT_EXPORTS,
] as const;
type ClientRouteExport = (typeof CLIENT_ROUTE_EXPORTS)[number];
const CLIENT_ROUTE_EXPORTS_SET = new Set(CLIENT_ROUTE_EXPORTS);
function isClientRouteExport(name: string): name is ClientRouteExport {
  return CLIENT_ROUTE_EXPORTS_SET.has(name as ClientRouteExport);
}

export function transformVirtualRouteModules({
  id,
  code,
}: {
  id: string;
  code: string;
}) {
  if (!id.includes("route-module")) {
    return;
  }

  if (isVirtualRouteModuleId(id)) {
    return createVirtualRouteModuleCode({ id, code });
  }

  if (isVirtualServerRouteModuleId(id)) {
    return createVirtualServerRouteModuleCode({ id, code });
  }

  if (isVirtualClientRouteModuleId(id)) {
    return createVirtualClientRouteModuleCode({ id, code });
  }
}

async function createVirtualRouteModuleCode({
  id,
  code: routeSource,
}: {
  id: string;
  code: string;
}) {
  const { staticExports, isServerFirstRoute } = parseRouteExports(routeSource);

  const clientModuleId = getVirtualClientModuleId(id);
  const serverModuleId = getVirtualServerModuleId(id);

  let code = "";
  if (isServerFirstRoute) {
    for (const staticExport of staticExports) {
      if (isClientNonComponentExport(staticExport)) {
        code += `export { ${staticExport} } from "${clientModuleId}";\n`;
      } else if (staticExport === "ServerComponent") {
        code += `export { ServerComponent as default } from "${serverModuleId}";\n`;
      } else {
        code += `export { ${staticExport} } from "${serverModuleId}";\n`;
      }
    }
  } else {
    for (const staticExport of staticExports) {
      if (isClientRouteExport(staticExport)) {
        code += `export { ${staticExport} } from "${clientModuleId}";\n`;
      } else {
        code += `export { ${staticExport} } from "${serverModuleId}";\n`;
      }
    }
  }

  if (isRootRouteId(id) && !staticExports.includes("ErrorBoundary")) {
    code += `export { ErrorBoundary } from "${clientModuleId}";\n`;
  }

  return code;
}

function createVirtualServerRouteModuleCode({
  id,
  code: routeSource,
}: {
  id: string;
  code: string;
}) {
  const { staticExports, isServerFirstRoute } = parseRouteExports(routeSource);
  const clientModuleId = getVirtualClientModuleId(id);
  const serverRouteModuleAst = babel.parse(routeSource, {
    sourceType: "module",
  });
  removeExports(
    serverRouteModuleAst,
    isServerFirstRoute ? CLIENT_NON_COMPONENT_EXPORTS : CLIENT_ROUTE_EXPORTS,
  );

  const generatorResult = babel.generate(serverRouteModuleAst);

  if (!isServerFirstRoute) {
    for (const staticExport of staticExports) {
      if (isClientRouteExport(staticExport)) {
        generatorResult.code += "\n";
        generatorResult.code += `export { ${staticExport} } from "${clientModuleId}";\n`;
      }
    }
  }

  return generatorResult;
}

function createVirtualClientRouteModuleCode({
  id,
  code: routeSource,
}: {
  id: string;
  code: string;
}) {
  const { staticExports, isServerFirstRoute } = parseRouteExports(routeSource);
  const exportsToRemove = isServerFirstRoute
    ? [...SERVER_ONLY_ROUTE_EXPORTS, ...COMPONENT_EXPORTS]
    : SERVER_ONLY_ROUTE_EXPORTS;

  const clientRouteModuleAst = babel.parse(routeSource, {
    sourceType: "module",
  });
  removeExports(clientRouteModuleAst, exportsToRemove);

  const generatorResult = babel.generate(clientRouteModuleAst);
  generatorResult.code = '"use client";' + generatorResult.code;

  if (isRootRouteId(id) && !staticExports.includes("ErrorBoundary")) {
    const hasRootLayout = staticExports.includes("Layout");
    generatorResult.code += `\nimport { createElement as __rr_createElement } from "react";\n`;
    generatorResult.code += `import { UNSAFE_RSCDefaultRootErrorBoundary } from "react-router";\n`;
    generatorResult.code += `export function ErrorBoundary() {\n`;
    generatorResult.code += `  return __rr_createElement(UNSAFE_RSCDefaultRootErrorBoundary, { hasRootLayout: ${hasRootLayout} });\n`;
    generatorResult.code += `}\n`;
  }

  return generatorResult;
}

function parseRouteExports(code: string) {
  const [, exportSpecifiers] = esModuleLexer(code);
  const staticExports = exportSpecifiers.map(({ n: name }) => name);
  return {
    staticExports,
    isServerFirstRoute: staticExports.some(
      (staticExport) => staticExport === "ServerComponent",
    ),
  };
}

function getVirtualClientModuleId(id: string): string {
  return `${id.split("?")[0]}?client-route-module${isRootRouteId(id) ? "&root-route=true" : ""}`;
}

function getVirtualServerModuleId(id: string): string {
  return `${id.split("?")[0]}?server-route-module${isRootRouteId(id) ? "&root-route=true" : ""}`;
}

function isRootRouteId(id: string): boolean {
  return /(\?|&)root-route=true(&|$)/.test(id);
}

function isVirtualRouteModuleId(id: string): boolean {
  return /(\?|&)route-module(&|$)/.test(id);
}

function isVirtualClientRouteModuleId(id: string): boolean {
  return /(\?|&)client-route-module(&|$)/.test(id);
}

function isVirtualServerRouteModuleId(id: string): boolean {
  return /(\?|&)server-route-module(&|$)/.test(id);
}
