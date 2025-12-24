import type * as Vite from "vite";
import * as babel from "../babel";
import { parse as esModuleLexer } from "es-module-lexer";
import { removeExports } from "../remove-exports";

const SERVER_COMPONENT_EXPORTS = ["ServerComponent"] as const;

type ServerComponentExport = (typeof SERVER_COMPONENT_EXPORTS)[number];
const SERVER_COMPONENT_EXPORTS_SET = new Set(SERVER_COMPONENT_EXPORTS);
function isServerComponentExport(name: string): name is ServerComponentExport {
  return SERVER_COMPONENT_EXPORTS_SET.has(name as ServerComponentExport);
}

const SERVER_ROUTE_EXPORTS = [
  ...SERVER_COMPONENT_EXPORTS,
  "loader",
  "action",
  "middleware",
  "headers",
] as const;
type ServerRouteExport = (typeof SERVER_ROUTE_EXPORTS)[number];
const SERVER_ROUTE_EXPORTS_SET = new Set(SERVER_ROUTE_EXPORTS);
function isServerRouteExport(name: string): name is ServerRouteExport {
  return SERVER_ROUTE_EXPORTS_SET.has(name as ServerRouteExport);
}

export const CLIENT_NON_COMPONENT_EXPORTS = [
  "clientAction",
  "clientLoader",
  "clientMiddleware",
  "handle",
  "meta",
  "links",
  "shouldRevalidate",
] as const;

const CLIENT_ROUTE_EXPORTS = [
  ...CLIENT_NON_COMPONENT_EXPORTS,
  "default",
  "ErrorBoundary",
  "HydrateFallback",
  "Layout",
] as const;
type ClientRouteExport = (typeof CLIENT_ROUTE_EXPORTS)[number];
const CLIENT_ROUTE_EXPORTS_SET = new Set(CLIENT_ROUTE_EXPORTS);
function isClientRouteExport(name: string): name is ClientRouteExport {
  return CLIENT_ROUTE_EXPORTS_SET.has(name as ClientRouteExport);
}

const ROUTE_EXPORTS = [
  ...SERVER_ROUTE_EXPORTS,
  ...CLIENT_ROUTE_EXPORTS,
] as const;
type RouteExport = (typeof ROUTE_EXPORTS)[number];
const ROUTE_EXPORTS_SET = new Set(ROUTE_EXPORTS);
function isRouteExport(name: string): name is RouteExport {
  return ROUTE_EXPORTS_SET.has(name as RouteExport);
}
function isCustomRouteExport(name: string) {
  return !isRouteExport(name);
}

function hasReactServerCondition(viteEnvironment: Vite.Environment) {
  return viteEnvironment.config.resolve.conditions.includes("react-server");
}

type ViteCommand = Vite.ConfigEnv["command"];

export function transformVirtualRouteModules({
  id,
  code,
  viteCommand,
  routeIdByFile,
  rootRouteFile,
  viteEnvironment,
}: {
  id: string;
  code: string;
  viteCommand: ViteCommand;
  routeIdByFile: Map<string, string>;
  rootRouteFile: string;
  viteEnvironment: Vite.Environment;
}) {
  if (isVirtualRouteModuleId(id) || routeIdByFile.has(id)) {
    return createVirtualRouteModuleCode({
      id,
      code,
      rootRouteFile,
      viteCommand,
      viteEnvironment,
    });
  }

  if (isVirtualServerRouteModuleId(id)) {
    return createVirtualServerRouteModuleCode({
      id,
      code,
      viteEnvironment,
    });
  }

  if (isVirtualClientRouteModuleId(id)) {
    return createVirtualClientRouteModuleCode({
      id,
      code,
      rootRouteFile,
      viteCommand,
    });
  }
}

async function createVirtualRouteModuleCode({
  id,
  code: routeSource,
  rootRouteFile,
  viteCommand,
  viteEnvironment,
}: {
  id: string;
  code: string;
  rootRouteFile: string;
  viteCommand: ViteCommand;
  viteEnvironment: Vite.Environment;
}) {
  const isReactServer = hasReactServerCondition(viteEnvironment);
  const { staticExports, hasClientExports } = parseRouteExports(routeSource);

  const clientModuleId = getVirtualClientModuleId(id);
  const serverModuleId = getVirtualServerModuleId(id);

  let code = "";
  if (isReactServer && staticExports.some(isServerComponentExport)) {
    code += `import React from "react";\n`;
  }
  for (const staticExport of staticExports) {
    if (isReactServer && isServerComponentExport(staticExport)) {
      code += `import { ${staticExport} as ${staticExport}WithoutCss } from "${serverModuleId}";\n`;
      code += `export ${staticExport === "ServerComponent" ? "default " : " "}function ${staticExport}(props) {\n`;
      code += `  return React.createElement(React.Fragment, null,\n`;
      code += `    import.meta.viteRsc.loadCss(),\n`;
      code += `    React.createElement(${staticExport}WithoutCss, props),\n`;
      code += `  );\n`;
      code += `}\n`;
    } else if (isReactServer && isServerRouteExport(staticExport)) {
      code += `export { ${staticExport} } from "${serverModuleId}";\n`;
    } else if (isClientRouteExport(staticExport)) {
      code += `export { ${staticExport} } from "${clientModuleId}";\n`;
    } else if (isCustomRouteExport(staticExport)) {
      code += `export { ${staticExport} } from "${isReactServer ? serverModuleId : clientModuleId}";\n`;
    }
  }

  if (
    isRootRouteFile({ id, rootRouteFile }) &&
    !staticExports.includes("ErrorBoundary")
  ) {
    code += `export { ErrorBoundary } from "${clientModuleId}";\n`;
  }

  if (viteCommand === "serve" && !hasClientExports) {
    code += `export { __ensureClientRouteModuleForHMR } from "${clientModuleId}";\n`;
  }

  return code;
}

function createVirtualServerRouteModuleCode({
  id,
  code: routeSource,
  viteEnvironment,
}: {
  id: string;
  code: string;
  viteEnvironment: Vite.Environment;
}) {
  if (!hasReactServerCondition(viteEnvironment)) {
    throw new Error(
      [
        "Virtual server route module was loaded outside of the RSC environment.",
        `Environment Name: ${viteEnvironment.name}`,
        `Module ID: ${id}`,
      ].join("\n"),
    );
  }

  const { staticExports } = parseRouteExports(routeSource);
  const clientModuleId = getVirtualClientModuleId(id);
  const serverRouteModuleAst = babel.parse(routeSource, {
    sourceType: "module",
  });
  removeExports(serverRouteModuleAst, CLIENT_ROUTE_EXPORTS);

  const generatorResult = babel.generate(serverRouteModuleAst);

  for (const staticExport of staticExports) {
    if (isClientRouteExport(staticExport)) {
      generatorResult.code += "\n";
      generatorResult.code += `export { ${staticExport} } from "${clientModuleId}";\n`;
    }
  }

  return generatorResult;
}

function createVirtualClientRouteModuleCode({
  id,
  code: routeSource,
  rootRouteFile,
  viteCommand,
}: {
  id: string;
  code: string;
  rootRouteFile: string;
  viteCommand: ViteCommand;
}) {
  const { staticExports, hasClientExports } = parseRouteExports(routeSource);

  const clientRouteModuleAst = babel.parse(routeSource, {
    sourceType: "module",
  });
  removeExports(clientRouteModuleAst, SERVER_ROUTE_EXPORTS);

  const generatorResult = babel.generate(clientRouteModuleAst);
  generatorResult.code = '"use client";' + generatorResult.code;

  if (
    isRootRouteFile({ id, rootRouteFile }) &&
    !staticExports.includes("ErrorBoundary")
  ) {
    const hasRootLayout = staticExports.includes("Layout");
    generatorResult.code += `\nimport { createElement as __rr_createElement } from "react";\n`;
    generatorResult.code += `import { UNSAFE_RSCDefaultRootErrorBoundary } from "react-router";\n`;
    generatorResult.code += `export function ErrorBoundary() {\n`;
    generatorResult.code += `  return __rr_createElement(UNSAFE_RSCDefaultRootErrorBoundary, { hasRootLayout: ${hasRootLayout} });\n`;
    generatorResult.code += `}\n`;
  }

  if (viteCommand === "serve" && !hasClientExports) {
    generatorResult.code += `\nexport const __ensureClientRouteModuleForHMR = true;`;
  }

  return generatorResult;
}

export function parseRouteExports(code: string) {
  const [, exportSpecifiers] = esModuleLexer(code);
  const staticExports = exportSpecifiers.map(({ n: name }) => name);
  return {
    staticExports,
    hasClientExports: staticExports.some(isClientRouteExport),
  };
}

function getVirtualClientModuleId(id: string): string {
  return `${id.split("?")[0]}?client-route-module`;
}

function getVirtualServerModuleId(id: string): string {
  return `${id.split("?")[0]}?server-route-module`;
}

function isVirtualRouteModuleId(id: string): boolean {
  return /(\?|&)route-module(&|$)/.test(id);
}

export function isVirtualClientRouteModuleId(id: string): boolean {
  return /(\?|&)client-route-module(&|$)/.test(id);
}

function isVirtualServerRouteModuleId(id: string): boolean {
  return /(\?|&)server-route-module(&|$)/.test(id);
}

function isRootRouteFile({
  id,
  rootRouteFile,
}: {
  id: string;
  rootRouteFile: string;
}): boolean {
  const filePath = id.split("?")[0];
  return filePath === rootRouteFile;
}
