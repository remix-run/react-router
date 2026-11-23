import * as babel from "@babel/core";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse as parseExports } from "es-module-lexer";
import { generate, parse } from "../babel";
import { removeExports } from "../remove-exports";
import { decorateComponentExportsWithProps } from "../with-props";
import * as VirtualModule from "../virtual-module";
import type {
  ReactIntegration,
  ReactIntegrationOptions,
} from "../react-integration";

const nodeRequire = createRequire(import.meta.url);
const virtualHmrRuntime = VirtualModule.create("hmr-runtime");
const virtualInjectHmrRuntime = VirtualModule.create("inject-hmr-runtime");

/** Preserve the existing compilation order, component wrapping and Refresh runtime. */
export function legacyReactIntegration({
  isEnabled,
  getCommand,
  getRouteId,
  isRouteVirtualModule,
  ignoredExports,
}: ReactIntegrationOptions): ReactIntegration {
  function addRefreshWrapper(code: string, id: string): string {
    let routeId = getRouteId(id);
    let acceptExports = routeId ? ignoredExports : [];
    return (
      REACT_REFRESH_HEADER.replaceAll("__SOURCE__", JSON.stringify(id)) +
      code +
      REACT_REFRESH_FOOTER.replaceAll("__SOURCE__", JSON.stringify(id))
        .replaceAll("__ACCEPT_EXPORTS__", JSON.stringify(acceptExports))
        .replaceAll("__ROUTE_ID__", JSON.stringify(routeId))
    );
  }

  return {
    external: false,
    getExportNames(code) {
      let [, exports] = parseExports(code);
      return exports.map(({ n }) => n);
    },
    transformRoute(code, id, { exportsToRemove }) {
      let ast = parse(code, { sourceType: "module" });
      if (exportsToRemove) removeExports(ast, exportsToRemove);
      decorateComponentExportsWithProps(ast);
      return generate(ast, {
        sourceMaps: true,
        filename: id,
        sourceFileName: id.split("?")[0],
      });
    },
    plugins: [
      {
        name: "react-router:inject-hmr-runtime",
        enforce: "pre",
        resolveId(id) {
          if (!isEnabled()) return;
          if (id === virtualInjectHmrRuntime.id) {
            return virtualInjectHmrRuntime.resolvedId;
          }
        },
        async load(id) {
          if (!isEnabled()) return;
          if (id !== virtualInjectHmrRuntime.resolvedId) return;

          return [
            `import RefreshRuntime from "${virtualHmrRuntime.id}"`,
            "RefreshRuntime.injectIntoGlobalHook(window)",
            "window.$RefreshReg$ = () => {}",
            "window.$RefreshSig$ = () => (type) => type",
            "window.__vite_plugin_react_preamble_installed__ = true",
          ].join("\n");
        },
      },
      {
        name: "react-router:hmr-runtime",
        enforce: "pre",
        resolveId(id) {
          if (!isEnabled()) return;
          if (id === virtualHmrRuntime.id) return virtualHmrRuntime.resolvedId;
        },
        async load(id) {
          if (!isEnabled()) return;
          if (id !== virtualHmrRuntime.resolvedId) return;

          let reactRefreshDir = path.dirname(
            nodeRequire.resolve("react-refresh/package.json"),
          );
          let reactRefreshRuntimePath = path.join(
            reactRefreshDir,
            "cjs/react-refresh-runtime.development.js",
          );

          return [
            "const exports = {}",
            await readFile(reactRefreshRuntimePath, "utf8"),
            await readFile(
              nodeRequire.resolve("./static/refresh-utils.mjs"),
              "utf8",
            ),
            "export default exports",
          ].join("\n");
        },
      },
      {
        name: "react-router:react-refresh-babel",
        async transform(code, id, options) {
          if (!isEnabled()) return;
          if (getCommand() !== "serve") return;
          if (id.includes("/node_modules/")) return;

          let [filepath] = id.split("?");
          let extensionsRE = /\.(jsx?|tsx?|mdx?)$/;
          if (!extensionsRE.test(filepath)) return;

          let devRuntime = "react/jsx-dev-runtime";
          let ssr = options?.ssr === true;
          let isJSX = filepath.endsWith("x");
          let useFastRefresh = !ssr && (isJSX || code.includes(devRuntime));
          if (!useFastRefresh) return;

          if (isRouteVirtualModule(id)) {
            return { code: addRefreshWrapper(code, id) };
          }

          let result = await babel.transformAsync(code, {
            babelrc: false,
            configFile: false,
            filename: id,
            sourceFileName: filepath,
            parserOpts: {
              sourceType: "module",
              allowAwaitOutsideFunction: true,
            },
            plugins: [
              [
                nodeRequire.resolve("react-refresh/babel"),
                { skipEnvCheck: true },
              ],
            ],
            sourceMaps: true,
          });
          if (result === null) return;

          code = result.code!;
          let refreshContentRE = /\$Refresh(?:Reg|Sig)\$\(/;
          if (refreshContentRE.test(code)) {
            code = addRefreshWrapper(code, id);
          }
          return { code, map: result.map };
        },
      },
    ],
  };
}

const REACT_REFRESH_HEADER = `
import RefreshRuntime from "${virtualHmrRuntime.id}";

const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
let prevRefreshReg;
let prevRefreshSig;

if (import.meta.hot && !inWebWorker) {
  if (!window.__vite_plugin_react_preamble_installed__) {
    throw new Error(
      "React Router Vite plugin can't detect preamble. Something is wrong."
    );
  }

  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    RefreshRuntime.register(type, __SOURCE__ + " " + id)
  };
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}`.replaceAll("\n", ""); // Header is all on one line so source maps aren't affected

const REACT_REFRESH_FOOTER = `
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh(__SOURCE__, currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      __ROUTE_ID__ && window.__reactRouterRouteModuleUpdates.set(__ROUTE_ID__, nextExports);
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate(currentExports, nextExports, __ACCEPT_EXPORTS__);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}`;
