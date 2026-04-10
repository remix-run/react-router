import {
  init as initEsModuleLexer,
  parse as esModuleLexer,
} from "es-module-lexer";
import type * as Vite from "vite";

import * as babel from "../babel";
import type { Cache } from "../cache";
import { removeExports } from "../remove-exports";
import {
  type RouteChunkExportName,
  detectRouteChunks as _detectRouteChunks,
} from "../route-chunks";
import { getVite, preloadVite } from "../vite";

const ENSURE_CLIENT_ROUTE_MODULE_CHUNK_FOR_HMR = `
import * as ___EnsureClientRouteModuleForHMR_REACT___ from "react";
export function EnsureClientRouteModuleForHMR___() { return ___EnsureClientRouteModuleForHMR_REACT___.createElement(___EnsureClientRouteModuleForHMR_REACT___.Fragment, null) }
`;

export function virtualRouteModulesPlugin({
  environments: { client = ["client", "ssr"], server = ["rsc"] } = {},
  isRouteModule,
  isRootRouteModule,
}: {
  environments?: {
    client?: string[];
    server?: string[];
  };
  isRouteModule(filename: string): boolean;
  isRootRouteModule(filename: string): boolean;
}) {
  let clientEnvironments = new Set(client);
  let serverEnvironments = new Set(server);
  let cache: Cache = new Map();

  async function createClientRouteEntry(id: string, code: string) {
    let result = "";

    let routeChunks = detectRouteChunks(cache, id, code);
    let { staticExports } = await parseRouteExports(code);

    validateRouteModuleExports(staticExports);

    let needsReactImport = false;
    for (let exportName of staticExports) {
      if (isServerRouteExport(exportName)) {
        continue;
      }

      if (
        (exportName === "clientAction" || exportName === "clientLoader") &&
        routeChunks.hasRouteChunkByExportName[
          exportName as RouteChunkExportName
        ]
      ) {
        result += `export const ${exportName} = async (...args) => import("${createId(id, "client-route-module", exportName)}").then(mod => mod.${exportName}(...args));\n`;
      } else if (exportName === "HydrateFallback") {
        needsReactImport = true;
        result += `export const ${exportName} = React.lazy(() => import("${createId(
          id,
          "client-route-module",
          routeChunks.hasRouteChunkByExportName[
            exportName as RouteChunkExportName
          ]
            ? exportName
            : "shared",
        )}").then(mod => ({ default: mod.${exportName} })));\n`;
      } else {
        result += `export { ${exportName} } from "${createId(
          id,
          "client-route-module",
          routeChunks.hasRouteChunkByExportName[
            exportName as RouteChunkExportName
          ]
            ? exportName
            : "shared",
        )}";\n`;
      }
    }

    if (needsReactImport) {
      result = `import * as React from "react";\n${result}`;
    }

    return {
      code: '"use client";\n' + result,
    };
  }

  async function createServerRouteEntry(
    id: string,
    code: string,
    isRootRouteModule: boolean,
  ) {
    let result = "";

    let routeChunks = detectRouteChunks(cache, id, code);
    let { staticExports } = await parseRouteExports(code);

    validateRouteModuleExports(staticExports);

    let needsReactImport = false;

    for (let exportName of staticExports) {
      if (isClientRouteExport(exportName)) {
        result += `export { ${exportName} } from "${createId(
          id,
          "client-route-module",
          routeChunks.hasRouteChunkByExportName[
            exportName as RouteChunkExportName
          ]
            ? exportName
            : "shared",
        )}";\n`;
      } else if (isServerComponentExport(exportName)) {
        needsReactImport = true;
        result += `import { ${exportName} as ${exportName}WithoutCss } from "${createId(id, "server-route-module")}";\n`;
        result += `export function ${exportName}(props) {\n`;
        result += `  return React.createElement(React.Fragment, null,\n`;
        result += `    import.meta.viteRsc.loadCss(),\n`;
        result += `    React.createElement(EnsureClientRouteModuleForHMR___, null),\n`;
        result += `    React.createElement(${exportName}WithoutCss, props),\n`;
        result += `  );\n`;
        result += `}\n`;
      } else {
        result += `export { ${exportName} } from "${createId(id, "server-route-module")}";\n`;
      }
    }

    if (needsReactImport) {
      result = `import * as React from "react";
import { EnsureClientRouteModuleForHMR___ } from "${createId(id, "client-route-module", "shared")}";\n
${result}`;
    }

    if (
      isRootRouteModule &&
      !staticExports.includes("ErrorBoundary") &&
      !staticExports.includes("ServerErrorBoundary")
    ) {
      result += `export { ErrorBoundary } from "${createId(id, "client-route-module", "shared")}";\n`;
    }

    return {
      code: result,
    };
  }

  function createServerRouteModule(code: string) {
    const ast = babel.parse(code, {
      sourceType: "module",
    });
    removeExports(ast, CLIENT_ROUTE_EXPORTS);
    return babel.generate(ast);
  }

  async function createClientRouteModuleChunk(
    id: string,
    code: string,
    chunk: "shared" | string,
    isRootRouteModule: boolean,
  ) {
    let routeChunks = detectRouteChunks(cache, id, code);

    const ast = babel.parse(code, {
      sourceType: "module",
    });
    const { staticExports } = await parseRouteExports(code);

    if (chunk === "shared") {
      removeExports(ast, [
        ...SERVER_ROUTE_EXPORTS,
        ...routeChunks.chunkedExports,
      ]);
    } else {
      const toRemove = new Set([...SERVER_ROUTE_EXPORTS, ...staticExports]);
      toRemove.delete(chunk);
      removeExports(ast, Array.from(toRemove));
    }

    const generated = babel.generate(ast);

    let result = '"use client";\n' + generated.code;

    if (chunk === "shared") {
      if (
        isRootRouteModule &&
        !staticExports.includes("ErrorBoundary") &&
        !staticExports.includes("ServerErrorBoundary")
      ) {
        const hasRootLayout =
          staticExports.includes("Layout") ||
          staticExports.includes("ServerLayout");
        result += `\nimport { createElement as __rr_createElement } from "react";\n`;
        result += `import { UNSAFE_RSCDefaultRootErrorBoundary } from "react-router";\n`;
        result += `export function ErrorBoundary() {\n`;
        result += `  return __rr_createElement(UNSAFE_RSCDefaultRootErrorBoundary, { hasRootLayout: ${hasRootLayout} });\n`;
        result += `}\n`;
      }

      result += ENSURE_CLIENT_ROUTE_MODULE_CHUNK_FOR_HMR;
    }

    result += `if (import.meta.hot) {\n`;
    result += `  import.meta.hot.accept((mod) => {
      if (!mod.default) {
        __reactRouterDataRouter.revalidate();
      }
    });\n`;
    result += `}\n`;

    return {
      code: result,
    };
  }

  return {
    name: "react-router-rsc-virtual-route-modules",
    transform: {
      order: "pre",
      async handler(_code, id) {
        const [filename, ...rest] = id.split("?");

        if (!isRouteModule(filename)) {
          return;
        }

        let isClientEnvironment = clientEnvironments.has(this.environment.name);
        let isServerEnvironment = serverEnvironments.has(this.environment.name);

        if (!isClientEnvironment && !isServerEnvironment) {
          return;
        }

        await preloadVite();
        let code = (
          await getVite().transformWithEsbuild(_code, id, {
            target: "esnext",
            format: "esm",
            jsx: "automatic",
          })
        ).code;

        let searchParams =
          rest.length > 0 ? new URLSearchParams(rest.join("?")) : null;

        let clientRouteModuleType = searchParams?.get("client-route-module");
        let isServerRouteModule = searchParams?.has("server-route-module");

        if (clientRouteModuleType) {
          return await createClientRouteModuleChunk(
            id,
            code,
            clientRouteModuleType,
            isRootRouteModule(filename),
          );
        }

        if (isServerRouteModule) {
          return createServerRouteModule(code);
        }

        if (isClientEnvironment) {
          return await createClientRouteEntry(id, code);
        }

        return await createServerRouteEntry(
          id,
          code,
          isRootRouteModule(filename),
        );
      },
    },
  } satisfies Vite.Plugin;
}

function createId(
  id: string,
  type: "client-route-module",
  value: string,
): string;
function createId(id: string, type: "server-route-module"): string;
function createId(
  id: string,
  type: "client-route-module" | "server-route-module",
  value?: string,
): string {
  let [base, ...rest] = id.split("?");
  const searchParams = new URLSearchParams(rest.join("?"));
  searchParams.delete("client-route-module");
  searchParams.delete("server-route-module");
  searchParams.set(type, value || "");
  return `${base}?${searchParams.toString()}`;
}

export async function parseRouteExports(code: string) {
  await initEsModuleLexer;
  const [, exportSpecifiers] = esModuleLexer(code);
  const staticExports = exportSpecifiers.map(({ n: name }) => name);
  return {
    staticExports,
    hasClientExports: staticExports.some(isClientRouteExport),
  };
}

const CLIENT_NON_COMPONENT_EXPORTS = [
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

const SERVER_COMPONENT_EXPORTS = [
  "ServerComponent",
  "ServerLayout",
  "ServerHydrateFallback",
  "ServerErrorBoundary",
] as const;

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

const CLIENT_MODULE_CHUNKS = new Set([
  "clientAction",
  "clientLoader",
  "clientMiddleware",
  "HydrateFallback",
]);

const MUTUALLY_EXCLUSIVE_ROUTE_EXPORTS = new Map([
  ["ErrorBoundary", "ServerErrorBoundary"],
  ["HydrateFallback", "ServerHydrateFallback"],
  ["Layout", "ServerLayout"],
  ["default", "ServerComponent"],
]);

function validateRouteModuleExports(toValidate: string[]) {
  let errors: [string, string][] = [];
  for (let [clientExport, serverExport] of MUTUALLY_EXCLUSIVE_ROUTE_EXPORTS) {
    if (
      toValidate.includes(clientExport) &&
      toValidate.includes(serverExport)
    ) {
      errors.push([clientExport, serverExport]);
    }
  }
  if (errors.length > 0) {
    throw new Error(
      `Invalid route module exports. The following pairs of exports are mutually exclusive and cannot be exported from the same module:\n` +
        errors
          .map(
            ([clientExport, serverExport]) =>
              `- ${clientExport} and ${serverExport}`,
          )
          .join("\n"),
    );
  }
}

type RouteChunks = ReturnType<typeof _detectRouteChunks>;

function detectRouteChunks(
  cache: Cache,
  id: string,
  code: string,
): RouteChunks {
  function noRouteChunks(): RouteChunks {
    return {
      chunkedExports: [],
      hasRouteChunks: false,
      hasRouteChunkByExportName: {
        clientAction: false,
        clientLoader: false,
        clientMiddleware: false,
        HydrateFallback: false,
      },
    };
  }

  // If this is the root route, we disable chunking since the chunks would never
  // be loaded on demand during navigation. Because the root route is matched
  // for all requests, all of its chunks would always be loaded up front during
  // the initial page load. Instead of firing off multiple requests to resolve
  // the root route code, we want it to be downloaded in a single request.
  // if (isRootRouteModuleId(ctx, id)) {
  //   return noRouteChunks();
  // }

  if (
    !Array.from(CLIENT_MODULE_CHUNKS).some((exportName) =>
      code.includes(exportName),
    )
  ) {
    return noRouteChunks();
  }

  let [filename] = id.split("?");

  return _detectRouteChunks(code, cache, filename);
}
