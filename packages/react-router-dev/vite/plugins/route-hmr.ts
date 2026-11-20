import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import type * as Vite from "vite";
import MagicString from "magic-string";
import { parseRouteSource, traverse, t, type Babel } from "../babel";

const nodeRequire = createRequire(import.meta.url);
const runtimeId = "virtual:react-router/route-hmr";
const resolvedRuntimeId = `\0${runtimeId}`;

function hasReactRefreshBoundary(ast: Babel.File) {
  const namespaces = new Set(
    ast.program.body.flatMap((node) =>
      t.isImportDeclaration(node) &&
      node.source.value.includes("/@react-refresh")
        ? node.specifiers.flatMap((specifier) =>
            t.isImportNamespaceSpecifier(specifier)
              ? [specifier.local.name]
              : [],
          )
        : [],
    ),
  );
  let found = false;
  traverse(ast, {
    CallExpression({ node: { callee } }) {
      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object) &&
        namespaces.has(callee.object.name) &&
        t.isIdentifier(callee.property, {
          name: "validateRefreshBoundaryAndEnqueueUpdate",
        })
      )
        found = true;
    },
  });
  return found;
}

/** Connect framework route APIs to the consumer's React refresh boundaries. */
export function routeHmrPlugin({
  isEnabled,
  getRouteId,
  ignoredExports,
}: {
  isEnabled: () => boolean;
  getRouteId: (id: string) => string | undefined;
  ignoredExports: readonly string[];
}): Vite.Plugin {
  return {
    name: "react-router:route-hmr",
    enforce: "post",
    resolveId(id) {
      if (id === runtimeId) return resolvedRuntimeId;
    },
    async load(id) {
      if (id === resolvedRuntimeId)
        return readFile(nodeRequire.resolve("./static/route-hmr.mjs"), "utf8");
    },
    transform(code, id, options) {
      if (!isEnabled() || options?.ssr) return;
      const routeId = getRouteId(id);
      if (!routeId) return;
      const ast = parseRouteSource(code, id);
      const hasRefreshBoundary = hasReactRefreshBoundary(ast);
      let suffix = 0;
      while (
        code.includes(`__reactRouterRegisterRoute${suffix}`) ||
        code.includes(`__reactRouterAcceptRouteUpdate${suffix}`)
      )
        suffix++;
      const register = `__reactRouterRegisterRoute${suffix}`;
      const accept = `__reactRouterAcceptRouteUpdate${suffix}`;
      const output = new MagicString(code);
      output.append(
        `\nimport { registerRoute as ${register}, acceptRouteUpdate as ${accept} } from "${runtimeId}";\n${register}(${JSON.stringify(id)}, ${JSON.stringify(ignoredExports)});\nif (import.meta.hot) import.meta.hot.accept(next => { if (next) ${accept}(${JSON.stringify(routeId)}, next, ${hasRefreshBoundary}, reason => import.meta.hot.invalidate(reason)); });`,
      );
      return {
        code: output.toString(),
        map: output.generateMap({
          hires: true,
          source: id,
          includeContent: true,
        }),
      };
    },
  };
}
