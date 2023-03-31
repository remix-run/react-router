import * as fs from "node:fs";
import * as path from "node:path";
import * as esbuild from "esbuild";

import type { RemixConfig } from "../../config";

export let hmrPlugin = ({
  remixConfig,
}: {
  remixConfig: RemixConfig;
}): esbuild.Plugin => {
  return {
    name: "remix-hmr",
    setup: async (build) => {
      build.onResolve({ filter: /^remix:hmr$/ }, (args) => {
        return {
          namespace: "hmr-runtime",
          path: args.path,
        };
      });
      build.onLoad({ filter: /.*/, namespace: "hmr-runtime" }, () => {
        let reactRefreshRuntime = require
          .resolve("react-refresh/runtime")
          .replace(/\\/g, "/");
        let contents = `
import RefreshRuntime from "${reactRefreshRuntime}";

declare global {
  interface Window {
    $RefreshReg$: any;
    $RefreshSig$: any;
  }
}

var prevRefreshReg = window.$RefreshReg$;
var prevRefreshSig = window.$RefreshSig$;

window.$RefreshReg$ = (type, id) => {
  const fullId = id;
  RefreshRuntime.register(type, fullId);
};
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
window.$RefreshRuntime$ = RefreshRuntime;

window.$RefreshRuntime$.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;

if (!window.__hmr__) {
  window.__hmr__ = {
    contexts: {},
  };
}

export function createHotContext(id: string): ImportMetaHot {
  let callback: undefined | ((mod: ModuleNamespace) => void);
  let disposed = false;

  let hot = {
    accept: (dep, cb) => {
      if (typeof dep !== "string") {
        cb = dep;
        dep = undefined;
      }
      if (dep) {
        if (window.__hmr__.contexts[dep]) {
          window.__hmr__.contexts[dep].dispose();
        }
        window.__hmr__.contexts[dep] = createHotContext(dep);
        window.__hmr__.contexts[dep].accept(cb);
        return;
      }
      if (disposed) {
        throw new Error("import.meta.hot.accept() called after dispose()");
      }
      if (callback) {
        throw new Error("import.meta.hot.accept() already called");
      }
      callback = cb;
    },
    dispose: () => {
      disposed = true;
    },
    emit(self: ModuleNamespace) {
      if (callback) {
        callback(self);
        return true;
      }
      return false;
    },
  };

  if (window.__hmr__.contexts[id]) {
    window.__hmr__.contexts[id].dispose();
  }
  window.__hmr__.contexts[id] = hot;

  return hot;
}

declare global {
  interface Window {
    __hmr__: any;
  }
}
        `;
        return { loader: "ts", contents, resolveDir: remixConfig.appDirectory };
      });

      build.onLoad({ filter: /.*/, namespace: "file" }, async (args) => {
        if (
          !args.path.match(
            /@remix-run[/\\]react[/\\]dist[/\\]esm[/\\]browser.js$/
          ) &&
          !args.path.match(/react-router[-dom]?[/\\]$/) &&
          (!args.path.match(/\.[tj]sx?$/) ||
            !fs.existsSync(args.path) ||
            !args.path.startsWith(remixConfig.appDirectory))
        ) {
          return undefined;
        }

        let sourceCode = fs.readFileSync(args.path, "utf8");

        let resultCode = await applyHMR(
          sourceCode,
          args,
          remixConfig,
          !!build.initialOptions.sourcemap,
          args.path.startsWith(remixConfig.appDirectory)
            ? fs.statSync(args.path).mtimeMs
            : undefined
        );

        return {
          contents: resultCode,
          loader: args.path.endsWith("x") ? "tsx" : "ts",
          resolveDir: path.dirname(args.path),
        };
      });
    },
  };
};

export async function applyHMR(
  sourceCode: string,
  args: esbuild.OnLoadArgs,
  remixConfig: RemixConfig,
  sourcemap: boolean,
  lastModified?: number
) {
  let babel = await import("@babel/core");
  // @ts-expect-error
  let reactRefresh = await import("react-refresh/babel");

  let IS_FAST_REFRESH_ENABLED = /\$RefreshReg\$\(/;

  // add import.meta.hot to the module
  let argsPath = args.path;
  let hmrId = JSON.stringify(
    path.relative(remixConfig.rootDirectory, argsPath)
  );
  let hmrPrefix = `import * as __hmr__ from "remix:hmr";
if (import.meta) {
import.meta.hot = __hmr__.createHotContext(
//@ts-expect-error
$id$
);
${lastModified ? `import.meta.hot.lastModified = "${lastModified}";` : ""}
}`.replace(/\$id\$/g, hmrId);
  let sourceCodeWithHMR = hmrPrefix + sourceCode;

  // turn the source code into JS for babel
  let jsWithHMR = esbuild.transformSync(sourceCodeWithHMR, {
    loader: argsPath.endsWith("x") ? "tsx" : "ts",
    format: args.pluginData?.format || "esm",
    jsx: "automatic",
  }).code;
  let resultCode = jsWithHMR;

  // run babel to add react-refresh
  let transformResult = babel.transformSync(jsWithHMR, {
    filename: argsPath,
    ast: false,
    compact: false,
    sourceMaps: sourcemap,
    configFile: false,
    babelrc: false,
    plugins: [[reactRefresh.default, { skipEnvCheck: true }]],
  });

  let jsWithReactRefresh = transformResult?.code || jsWithHMR;

  // auto opt-in to accepting fast refresh updates if the module
  // has react components
  if (IS_FAST_REFRESH_ENABLED.test(jsWithReactRefresh)) {
    resultCode =
      `
        if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
          console.warn('remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.');
        } else {
          var prevRefreshReg = window.$RefreshReg$;
          var prevRefreshSig = window.$RefreshSig$;
          window.$RefreshReg$ = (type, id) => {
            window.$RefreshRuntime$.register(type, ${JSON.stringify(
              hmrId
            )} + id);
          }
          window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
        }
      ` +
      jsWithReactRefresh +
      `
        window.$RefreshReg$ = prevRefreshReg;
        window.$RefreshSig$ = prevRefreshSig;
      `;
  }

  return resultCode;
}
