import * as fs from "node:fs";
import * as path from "node:path";
import type * as esbuild from "esbuild";

import type { RemixConfig } from "../../../config";
import type { Context } from "../../context";

export let hmrPlugin = ({ config }: Context): esbuild.Plugin => {
  return {
    name: "remix-hmr",
    setup: async (build) => {
      let cache = new Map();

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
        return { loader: "ts", contents, resolveDir: config.appDirectory };
      });

      // This is only needed within the Remix repo because the symlink to the
      // `packages/remix-react` folder doesn't match the regex below
      let remixReactPath = require.resolve(
        "@remix-run/react/dist/esm/browser.js",
        { paths: [config.rootDirectory] }
      );

      build.onLoad({ filter: /.*/, namespace: "file" }, async (args) => {
        if (
          args.path !== remixReactPath &&
          !args.path.match(
            /@remix-run[/\\]react[/\\]dist[/\\]esm[/\\]browser.js$/
          ) &&
          !args.path.match(/react-router[-dom]?[/\\]$/) &&
          (!args.path.match(/\.[tj]sx?$/) ||
            !fs.existsSync(args.path) ||
            !args.path.startsWith(config.appDirectory))
        ) {
          return undefined;
        }

        let sourceCode = fs.readFileSync(args.path, "utf8");

        let value = cache.get(args.path);

        if (!value || value.sourceCode !== sourceCode) {
          let resultCode = await applyHMR(
            sourceCode,
            args,
            config,
            !!build.initialOptions.sourcemap,
            args.path.startsWith(config.appDirectory)
              ? fs.statSync(args.path).mtimeMs
              : undefined
          );
          value = {
            sourceCode,
            output: {
              contents: resultCode,
              loader: args.path.endsWith(".ts") ? "ts" : "tsx",
              resolveDir: path.dirname(args.path),
            },
          };
          cache.set(args.path, value);
        }

        return value.output;
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
  let babelPresetTypescript = await import("@babel/preset-typescript");
  // @ts-expect-error
  let babelJsx = await import("@babel/plugin-syntax-jsx");
  // @ts-expect-error
  let reactRefresh = await import("react-refresh/babel");
  // @ts-expect-error
  let babelDecorators = await import("@babel/plugin-syntax-decorators");

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
}
// REMIX HMR END
\n`.replace(/\$id\$/g, hmrId);
  let sourceCodeWithHMR = hmrPrefix + sourceCode;

  // run babel to add react-refresh
  let transformResult = babel.transformSync(sourceCodeWithHMR, {
    filename: argsPath,
    ast: false,
    compact: false,
    sourceMaps: sourcemap,
    configFile: false,
    babelrc: false,
    presets: [babelPresetTypescript.default],
    plugins: [
      [babelDecorators.default, { legacy: true }],
      babelJsx.default,
      [reactRefresh.default, { skipEnvCheck: true }],
    ],
  });

  let jsWithReactRefresh = transformResult?.code ?? sourceCodeWithHMR;

  // auto opt-in to accepting fast refresh updates if the module
  // has react components
  if (!IS_FAST_REFRESH_ENABLED.test(jsWithReactRefresh)) {
    return "// REMIX HMR BEGIN\n" + sourceCodeWithHMR;
  }
  return (
    `// REMIX HMR BEGIN
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn('remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.');
} else {
  var prevRefreshReg = window.$RefreshReg$;
  var prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, ${JSON.stringify(hmrId)} + id);
  }
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}\n` +
    jsWithReactRefresh +
    `\n
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;`
  );
}
