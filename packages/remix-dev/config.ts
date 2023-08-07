import { execSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import fse from "fs-extra";
import getPort from "get-port";
import NPMCliPackageJson from "@npmcli/package-json";
import { coerce } from "semver";
import type { NodePolyfillsOptions as EsbuildPluginsNodeModulesPolyfillOptions } from "esbuild-plugins-node-modules-polyfill";

import type { RouteManifest, DefineRoutesFunction } from "./config/routes";
import { defineRoutes } from "./config/routes";
import { defineConventionalRoutes } from "./config/routesConvention";
import { ServerMode, isValidServerMode } from "./config/serverModes";
import { serverBuildVirtualModule } from "./compiler/server/virtualModules";
import { flatRoutes } from "./config/flat-routes";
import { detectPackageManager } from "./cli/detectPackageManager";
import { logger } from "./tux";

export interface RemixMdxConfig {
  rehypePlugins?: any[];
  remarkPlugins?: any[];
}

export type RemixMdxConfigFunction = (
  filename: string
) => Promise<RemixMdxConfig | undefined> | RemixMdxConfig | undefined;

export type ServerBuildTarget =
  | "node-cjs"
  | "arc"
  | "netlify"
  | "vercel"
  | "cloudflare-pages"
  | "cloudflare-workers"
  | "deno";

export type ServerModuleFormat = "esm" | "cjs";
export type ServerPlatform = "node" | "neutral";

type Dev = {
  command?: string;
  manual?: boolean;
  port?: number;
  tlsKey?: string;
  tlsCert?: string;

  /** @deprecated remove in v2 */
  restart?: boolean;
  /** @deprecated remove in v2 */
  scheme?: string;
  /** @deprecated remove in v2 */
  host?: string;
};

interface FutureConfig {
  v2_dev: boolean | Dev;
  /** @deprecated Use the `postcss` config option instead */
  unstable_postcss: boolean;
  /** @deprecated Use the `tailwind` config option instead */
  unstable_tailwind: boolean;
  v2_errorBoundary: boolean;
  v2_headers: boolean;
  v2_meta: boolean;
  v2_normalizeFormMethod: boolean;
  v2_routeConvention: boolean;
}

type ServerNodeBuiltinsPolyfillOptions = Pick<
  EsbuildPluginsNodeModulesPolyfillOptions,
  "modules"
>;

/**
 * The user-provided config in `remix.config.js`.
 */
export interface AppConfig {
  /**
   * The path to the `app` directory, relative to `remix.config.js`. Defaults
   * to `"app"`.
   */
  appDirectory?: string;

  /**
   * The path to a directory Remix can use for caching things in development,
   * relative to `remix.config.js`. Defaults to `".cache"`.
   */
  cacheDirectory?: string;

  /**
   * A function for defining custom routes, in addition to those already defined
   * using the filesystem convention in `app/routes`. Both sets of routes will
   * be merged.
   */
  routes?: (
    defineRoutes: DefineRoutesFunction
  ) => Promise<ReturnType<DefineRoutesFunction>>;

  /**
   * The path to the browser build, relative to `remix.config.js`. Defaults to
   * "public/build".
   */
  assetsBuildDirectory?: string;

  /**
   * The path to the browser build, relative to remix.config.js. Defaults to
   * "public/build".
   *
   * @deprecated Use `{@link AppConfig.assetsBuildDirectory}` instead
   */
  browserBuildDirectory?: string;

  /**
   * The URL prefix of the browser build with a trailing slash. Defaults to
   * `"/build/"`. This is the path the browser will use to find assets.
   */
  publicPath?: string;

  /**
   * The port number to use for the dev server. Defaults to 8002.
   *
   * @deprecated Use {@link AppConfig.future.v2_dev.port} instead.
   */
  devServerPort?: number;

  /**
   * The delay, in milliseconds, before the dev server broadcasts a reload
   * event. There is no delay by default.
   *
   * @deprecated Enable {@link AppConfig.future.v2_dev} to eliminate the race
   * conditions that necessitated this option.
   */
  devServerBroadcastDelay?: number;

  /**
   * Additional MDX remark / rehype plugins.
   */
  mdx?: RemixMdxConfig | RemixMdxConfigFunction;

  /**
   * Whether to process CSS using PostCSS if `postcss.config.js` is present.
   * Defaults to `false`.
   */
  postcss?: boolean;

  /**
   * A server entrypoint, relative to the root directory that becomes your
   * server's main module. If specified, Remix will compile this file along with
   * your application into a single file to be deployed to your server. This
   * file can use either a `.js` or `.ts` file extension.
   */
  server?: string;

  /**
   * The path to the server build, relative to `remix.config.js`. Defaults to
   * "build".
   *
   * @deprecated Use {@link AppConfig.serverBuildPath} instead.
   */
  serverBuildDirectory?: string;

  /**
   * The path to the server build file, relative to `remix.config.js`. This file
   * should end in a `.js` extension and should be deployed to your server.
   */
  serverBuildPath?: string;

  /**
   * The target of the server build. Defaults to "node-cjs".
   *
   * @deprecated Use a combination of `{@link AppConfig.publicPath}`, `{@link AppConfig.serverBuildPath}`, `{@link AppConfig.serverConditions}`, `{@link AppConfig.serverDependenciesToBundle}`, `{@link AppConfig.serverMainFields}`, `{@link AppConfig.serverMinify}`, `{@link AppConfig.serverModuleFormat}` and/or `{@link AppConfig.serverPlatform}` instead.
   */
  serverBuildTarget?: ServerBuildTarget;

  /**
   * The order of conditions to use when resolving server dependencies'
   * `exports` field in `package.json`.
   *
   * For more information, see: https://esbuild.github.io/api/#conditions
   */
  serverConditions?: string[];

  /**
   * A list of patterns that determined if a module is transpiled and included
   * in the server bundle. This can be useful when consuming ESM only packages
   * in a CJS build.
   */
  serverDependenciesToBundle?: "all" | Array<string | RegExp>;

  /**
   * The order of main fields to use when resolving server dependencies.
   * Defaults to `["main", "module"]`.
   *
   * For more information, see: https://esbuild.github.io/api/#main-fields
   */
  serverMainFields?: string[];

  /**
   * Whether to minify the server build in production or not.
   * Defaults to `false`.
   */
  serverMinify?: boolean;

  /**
   * The output format of the server build. Defaults to "cjs".
   */
  serverModuleFormat?: ServerModuleFormat;

  /**
   * The Node.js polyfills to include in the server build when targeting
   * non-Node.js server platforms.
   */
  serverNodeBuiltinsPolyfill?: ServerNodeBuiltinsPolyfillOptions;

  /**
   * The platform the server build is targeting. Defaults to "node".
   */
  serverPlatform?: ServerPlatform;

  /**
   * Whether to support Tailwind functions and directives in CSS files if `tailwindcss` is installed.
   * Defaults to `false`.
   */
  tailwind?: boolean;

  /**
   * A list of filenames or a glob patterns to match files in the `app/routes`
   * directory that Remix will ignore. Matching files will not be recognized as
   * routes.
   */
  ignoredRouteFiles?: string[];

  /**
   * A function for defining custom directories to watch while running `remix dev`, in addition to `appDirectory`.
   */
  watchPaths?:
    | string
    | string[]
    | (() => Promise<string | string[]> | string | string[]);

  future?: Partial<FutureConfig>;
}

/**
 * Fully resolved configuration object we use throughout Remix.
 */
export interface RemixConfig {
  /**
   * The absolute path to the root of the Remix project.
   */
  rootDirectory: string;

  /**
   * The absolute path to the application source directory.
   */
  appDirectory: string;

  /**
   * The absolute path to the cache directory.
   */
  cacheDirectory: string;

  /**
   * The path to the entry.client file, relative to `config.appDirectory`.
   */
  entryClientFile: string;

  /**
   * The absolute path to the entry.client file.
   */
  entryClientFilePath: string;

  /**
   * The path to the entry.server file, relative to `config.appDirectory`.
   */
  entryServerFile: string;

  /**
   * The absolute path to the entry.server file.
   */
  entryServerFilePath: string;

  /**
   * An object of all available routes, keyed by route id.
   */
  routes: RouteManifest;

  /**
   * The absolute path to the assets build directory.
   */
  assetsBuildDirectory: string;

  /**
   * the original relative path to the assets build directory
   */
  relativeAssetsBuildDirectory: string;

  /**
   * The URL prefix of the public build with a trailing slash.
   */
  publicPath: string;

  /**
   * The port number to use for the dev (asset) server.
   *
   * @deprecated Use {@link RemixConfig.future.v2_dev.port} instead.
   */
  devServerPort: number;

  /**
   * The delay before the dev (asset) server broadcasts a reload event.
   *
   * @deprecated Enable {@link RemixConfig.future.v2_dev} to eliminate the race
   * conditions that necessitated this option.
   */
  devServerBroadcastDelay: number;

  /**
   * Additional MDX remark / rehype plugins.
   */
  mdx?: RemixMdxConfig | RemixMdxConfigFunction;

  /**
   * Whether to process CSS using PostCSS if `postcss.config.js` is present.
   * Defaults to `false`.
   */
  postcss: boolean;

  /**
   * The path to the server build file. This file should end in a `.js`.
   */
  serverBuildPath: string;

  /**
   * The target of the server build. Defaults to "node-cjs".
   *
   * @deprecated Use a combination of `{@link AppConfig.publicPath}`, `{@link AppConfig.serverBuildPath}`, `{@link AppConfig.serverConditions}`, `{@link AppConfig.serverDependenciesToBundle}`, `{@link AppConfig.serverMainFields}`, `{@link AppConfig.serverMinify}`, `{@link AppConfig.serverModuleFormat}` and/or `{@link AppConfig.serverPlatform}` instead.   */
  serverBuildTarget?: ServerBuildTarget;

  /**
   * The default entry module for the server build if a {@see AppConfig.server}
   * is not provided.
   */
  serverBuildTargetEntryModule: string;

  /**
   * The order of conditions to use when resolving server dependencies'
   * `exports` field in `package.json`.
   *
   * For more information, see: https://esbuild.github.io/api/#conditions
   */
  serverConditions?: string[];

  /**
   * A list of patterns that determined if a module is transpiled and included
   * in the server bundle. This can be useful when consuming ESM only packages
   * in a CJS build.
   */
  serverDependenciesToBundle: "all" | Array<string | RegExp>;

  /**
   * A server entrypoint relative to the root directory that becomes your
   * server's main module.
   */
  serverEntryPoint?: string;

  /**
   * The order of main fields to use when resolving server dependencies.
   * Defaults to `["main", "module"]`.
   *
   * For more information, see: https://esbuild.github.io/api/#main-fields
   */
  serverMainFields: string[];

  /**
   * Whether to minify the server build in production or not.
   * Defaults to `false`.
   */
  serverMinify: boolean;

  /**
   * The mode to use to run the server.
   */
  serverMode: ServerMode;

  /**
   * The output format of the server build. Defaults to "cjs".
   */
  serverModuleFormat: ServerModuleFormat;

  /**
   * The Node.js polyfills to include in the server build when targeting
   * non-Node.js server platforms.
   */
  serverNodeBuiltinsPolyfill?: ServerNodeBuiltinsPolyfillOptions;

  /**
   * The platform the server build is targeting. Defaults to "node".
   */
  serverPlatform: ServerPlatform;

  /**
   * Whether to support Tailwind functions and directives in CSS files if `tailwindcss` is installed.
   * Defaults to `false`.
   */
  tailwind: boolean;

  /**
   * A list of directories to watch.
   */
  watchPaths: string[];

  /**
   * The path for the tsconfig file, if present on the root directory.
   */
  tsconfigPath: string | undefined;

  future: FutureConfig;
}

/**
 * Returns a fully resolved config object from the remix.config.js in the given
 * root directory.
 */
export async function readConfig(
  remixRoot?: string,
  serverMode = ServerMode.Production
): Promise<RemixConfig> {
  if (!isValidServerMode(serverMode)) {
    throw new Error(`Invalid server mode "${serverMode}"`);
  }

  if (!remixRoot) {
    remixRoot = process.env.REMIX_ROOT || process.cwd();
  }

  let rootDirectory = path.resolve(remixRoot);
  let configFile = findConfig(rootDirectory, "remix.config", configExts);

  let appConfig: AppConfig = {};
  if (configFile) {
    let appConfigModule: any;
    try {
      // shout out to next
      // https://github.com/vercel/next.js/blob/b15a976e11bf1dc867c241a4c1734757427d609c/packages/next/server/config.ts#L748-L765
      if (process.env.JEST_WORKER_ID) {
        // dynamic import does not currently work inside of vm which
        // jest relies on so we fall back to require for this case
        // https://github.com/nodejs/node/issues/35889
        appConfigModule = require(configFile);
      } else {
        appConfigModule = await import(pathToFileURL(configFile).href);
      }
      appConfig = appConfigModule?.default || appConfigModule;
    } catch (error: unknown) {
      throw new Error(
        `Error loading Remix config at ${configFile}\n${String(error)}`
      );
    }
  }

  if (appConfig.serverBuildTarget) {
    serverBuildTargetWarning();
  }

  if (!appConfig.future?.v2_errorBoundary) {
    errorBoundaryWarning();
  }

  if (!appConfig.future?.v2_normalizeFormMethod) {
    formMethodWarning();
  }

  if (!appConfig.future?.v2_meta) {
    metaWarning();
  }

  if (!appConfig.future?.v2_headers) {
    headersWarning();
  }

  let isCloudflareRuntime = ["cloudflare-pages", "cloudflare-workers"].includes(
    appConfig.serverBuildTarget ?? ""
  );
  let isDenoRuntime = appConfig.serverBuildTarget === "deno";

  let serverBuildPath = resolveServerBuildPath(rootDirectory, appConfig);
  let serverBuildTarget = appConfig.serverBuildTarget;
  let serverBuildTargetEntryModule = `export * from ${JSON.stringify(
    serverBuildVirtualModule.id
  )};`;
  let serverConditions = appConfig.serverConditions;
  let serverDependenciesToBundle = appConfig.serverDependenciesToBundle || [];
  let serverEntryPoint = appConfig.server;
  let serverMainFields = appConfig.serverMainFields;
  let serverMinify = appConfig.serverMinify;

  if (!appConfig.serverModuleFormat) {
    serverModuleFormatWarning();
  }

  let serverModuleFormat = appConfig.serverModuleFormat || "cjs";
  let serverPlatform = appConfig.serverPlatform || "node";
  if (isCloudflareRuntime) {
    serverConditions ??= ["worker"];
    serverDependenciesToBundle = "all";
    serverMainFields ??= ["browser", "module", "main"];
    serverMinify ??= true;
    serverModuleFormat = "esm";
    serverPlatform = "neutral";
  }
  if (isDenoRuntime) {
    serverConditions ??= ["deno", "worker"];
    serverDependenciesToBundle = "all";
    serverMainFields ??= ["module", "main"];
    serverModuleFormat = "esm";
    serverPlatform = "neutral";
  }
  serverMainFields ??=
    serverModuleFormat === "esm" ? ["module", "main"] : ["main", "module"];
  serverMinify ??= false;

  let serverNodeBuiltinsPolyfill: RemixConfig["serverNodeBuiltinsPolyfill"];

  if (appConfig.serverNodeBuiltinsPolyfill != null) {
    serverNodeBuiltinsPolyfill = appConfig.serverNodeBuiltinsPolyfill;
  } else if (serverPlatform !== "node") {
    serverNodeBuiltinsPolyfillWarning();
    serverNodeBuiltinsPolyfill = {
      modules: {
        // Note: Remove this in Remix v2
        // All polyfills are ultimately sourced from JSPM: https://github.com/jspm/jspm-core/tree/main/nodelibs/browser
        // Polyfills we choose to disable are explicitly configured here so we can note the reason for disabling them.
        // Links are provided here to make it easier to review the source code for each polyfill.
        _stream_duplex: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/_stream_duplex.js
        _stream_passthrough: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/_stream_passthrough.js
        _stream_readable: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/_stream_readable.js
        _stream_transform: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/_stream_transform.js
        _stream_writable: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/_stream_writable.js
        assert: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/assert.js
        "assert/strict": true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/assert/strict.js
        async_hooks: false, // Unimplemented, throws on usage: https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/async_hooks.js. Also Cloudflare Workers provides an implementation: https://developers.cloudflare.com/workers/runtime-apis/nodejs/asynclocalstorage/
        buffer: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/buffer.js
        child_process: false, // Unimplemented, throws on usage: https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/child_process.js
        cluster: false, // Unimplemented, throws on usage: https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/cluster.js
        console: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/console.js
        constants: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/constants.js
        crypto: "empty", // Polyfill exists (https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/crypto.js) but source code is over 2MB! Also, it was "empty" in esbuild-plugin-polyfill-node which we used previously as of Remix v1.17.0: https://github.com/cyco130/esbuild-plugin-polyfill-node/blob/9afcb6abaf9062a15daaffce9a14e478b365139c/src/index.ts#L144
        dgram: false, // Unimplemented, throws on usage: https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/dgram.js
        diagnostics_channel: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/diagnostics_channel.js
        dns: false, // Unimplemented, throws on usage: https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/dns.js
        "dns/promises": false, // Unimplemented, throws on usage: https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/dns/promises.js
        domain: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/domain.js
        events: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/events.js
        fs: "empty", // Polyfill was "empty" in esbuild-plugin-polyfill-node which we used previously as of Remix v1.17.0 (https://github.com/cyco130/esbuild-plugin-polyfill-node/blob/9afcb6abaf9062a15daaffce9a14e478b365139c/src/index.ts#L143C6-L143C6). Also, the polyfill immediately throws when importing in Cloudflare Workers due to top-level setTimeout usage which is not allowed outside of the request lifecycle: https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/fs.js
        "fs/promises": "empty", // See above
        http: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/http.js
        http2: false, // Unimplemented, throws on usage: https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/http2.js
        https: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/https.js
        module: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/module.js
        net: false, // Unimplemented, throws on usage: https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/net.js
        os: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/os.js
        path: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/path.js
        "path/posix": true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/path/posix.js
        "path/win32": true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/path/win32.js
        perf_hooks: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/perf_hooks.js
        process: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/process.js
        punycode: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/punycode.js
        querystring: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/querystring.js
        readline: false, // Unimplemented, throws on usage: https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/readline.js
        repl: false, // Unimplemented, throws on usage: https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/repl.js
        stream: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/stream.js
        "stream/promises": true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/stream/promises.js
        "stream/web": true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/stream/web.js
        string_decoder: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/string_decoder.js
        sys: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/sys.js
        timers: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/timers.js
        "timers/promises": true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/timers/promises.js
        tls: false, // Unimplemented, throws on usage: https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/tls.js
        tty: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/tty.js - Effectively not implemented, but provides `isatty` as `false` so consumers can check to avoid it
        url: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/url.js
        util: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/util.js
        "util/types": true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/util/types.js
        v8: false, // Unimplemented, throws on usage: https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/v8.js
        vm: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/vm.js
        wasi: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/wasi.js
        worker_threads: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/worker_threads.js
        zlib: true, // https://github.com/jspm/jspm-core/blob/main/nodelibs/browser/zlib.js
      },
    };
  }

  if (appConfig.future) {
    if ("unstable_cssModules" in appConfig.future) {
      logger.warn(
        "The `future.unstable_cssModules` config option has been removed",
        {
          details: [
            "CSS Modules are now enabled automatically.",
            "You should remove the `unstable_cssModules` option from your Remix config.",
          ],
          key: "unstable_cssModules",
        }
      );
    }

    if ("unstable_cssSideEffectImports" in appConfig.future) {
      logger.warn(
        "The `future.unstable_cssSideEffectImports` config option has been removed",
        {
          details: [
            "CSS side-effect imports are now enabled automatically.",
            "You should remove the `unstable_cssSideEffectImports` option from your Remix config",
          ],
          key: "unstable_cssSideEffectImports",
        }
      );
    }

    if ("unstable_vanillaExtract" in appConfig.future) {
      logger.warn(
        "The `future.unstable_vanillaExtract` config option has been removed.",
        {
          details: [
            "Vanilla Extract is now enabled automatically.",
            "You should remove the `unstable_vanillaExtract` option from your Remix config",
          ],
          key: "unstable_vanillaExtract",
        }
      );
    }

    if (appConfig.future.unstable_postcss !== undefined) {
      logger.warn(
        "The `future.unstable_postcss` config option has been deprecated.",
        {
          details: [
            "PostCSS support is now stable.",
            "Use the `postcss` config option instead.",
          ],
          key: "unstable_postcss",
        }
      );
    }

    if (appConfig.future.unstable_tailwind !== undefined) {
      logger.warn(
        "The `future.unstable_tailwind` config option has been deprecated.",
        {
          details: [
            "Tailwind support is now stable.",
            "Use the `tailwind` config option instead.",
          ],
          key: "unstable_tailwind",
        }
      );
    }

    if ("unstable_dev" in appConfig.future) {
      logger.warn("The `future.unstable_dev` config option has been removed", {
        details: [
          "The v2 dev server is now stable.",
          "Use the `future.v2_dev` config option instead.",
          "-> https://remix.run/docs/en/main/pages/v2#dev-server",
        ],
        key: "unstable_dev",
      });
    }
  }

  let mdx = appConfig.mdx;
  let postcss =
    appConfig.postcss ?? appConfig.future?.unstable_postcss === true;
  let tailwind =
    appConfig.tailwind ?? appConfig.future?.unstable_tailwind === true;

  let appDirectory = path.resolve(
    rootDirectory,
    appConfig.appDirectory || "app"
  );

  let cacheDirectory = path.resolve(
    rootDirectory,
    appConfig.cacheDirectory || ".cache"
  );

  let defaultsDirectory = path.resolve(__dirname, "config", "defaults");

  let userEntryClientFile = findEntry(appDirectory, "entry.client");
  let userEntryServerFile = findEntry(appDirectory, "entry.server");

  let entryServerFile: string;
  let entryClientFile: string;

  let pkgJson = await NPMCliPackageJson.load(remixRoot);
  let deps = pkgJson.content.dependencies ?? {};

  if (userEntryServerFile) {
    entryServerFile = userEntryServerFile;
  } else {
    let serverRuntime = deps["@remix-run/deno"]
      ? "deno"
      : deps["@remix-run/cloudflare"]
      ? "cloudflare"
      : deps["@remix-run/node"]
      ? "node"
      : undefined;

    if (!serverRuntime) {
      let serverRuntimes = [
        "@remix-run/deno",
        "@remix-run/cloudflare",
        "@remix-run/node",
      ];
      let formattedList = disjunctionListFormat.format(serverRuntimes);
      throw new Error(
        `Could not determine server runtime. Please install one of the following: ${formattedList}`
      );
    }

    let clientRenderer = deps["@remix-run/react"] ? "react" : undefined;

    if (!clientRenderer) {
      throw new Error(
        `Could not determine renderer. Please install the following: @remix-run/react`
      );
    }

    let maybeReactVersion = coerce(deps.react);
    if (!maybeReactVersion) {
      let react = ["react", "react-dom"];
      let list = conjunctionListFormat.format(react);
      throw new Error(
        `Could not determine React version. Please install the following packages: ${list}`
      );
    }

    let type: "stream" | "string" =
      maybeReactVersion.major >= 18 || maybeReactVersion.raw === "0.0.0"
        ? "stream"
        : "string";

    if (!deps["isbot"] && type === "stream") {
      console.log(
        "adding `isbot` to your package.json, you should commit this change"
      );

      pkgJson.update({
        dependencies: {
          ...pkgJson.content.dependencies,
          isbot: "latest",
        },
      });

      await pkgJson.save();

      let packageManager = detectPackageManager() ?? "npm";

      execSync(`${packageManager} install`, {
        cwd: remixRoot,
        stdio: "inherit",
      });
    }

    entryServerFile = `${serverRuntime}/entry.server.${clientRenderer}-${type}.tsx`;
  }

  if (userEntryClientFile) {
    entryClientFile = userEntryClientFile;
  } else {
    let clientRenderer = deps["@remix-run/react"] ? "react" : undefined;

    if (!clientRenderer) {
      throw new Error(
        `Could not determine runtime. Please install the following: @remix-run/react`
      );
    }

    let maybeReactVersion = coerce(deps.react);
    if (!maybeReactVersion) {
      let react = ["react", "react-dom"];
      let list = conjunctionListFormat.format(react);
      throw new Error(
        `Could not determine React version. Please install the following packages: ${list}`
      );
    }

    let type: "stream" | "string" =
      maybeReactVersion.major >= 18 || maybeReactVersion.raw === "0.0.0"
        ? "stream"
        : "string";

    entryClientFile = `entry.client.${clientRenderer}-${type}.tsx`;
  }

  let entryClientFilePath = userEntryClientFile
    ? path.resolve(appDirectory, userEntryClientFile)
    : path.resolve(defaultsDirectory, entryClientFile);

  let entryServerFilePath = userEntryServerFile
    ? path.resolve(appDirectory, userEntryServerFile)
    : path.resolve(defaultsDirectory, entryServerFile);

  if (appConfig.browserBuildDirectory) {
    browserBuildDirectoryWarning();
  }

  let assetsBuildDirectory =
    appConfig.assetsBuildDirectory ||
    appConfig.browserBuildDirectory ||
    path.join("public", "build");

  let absoluteAssetsBuildDirectory = path.resolve(
    rootDirectory,
    assetsBuildDirectory
  );

  if (appConfig.devServerPort) {
    devServerPortWarning();
  }
  if (appConfig.devServerBroadcastDelay) {
    devServerBroadcastDelayWarning();
  }

  let devServerPort =
    Number(process.env.REMIX_DEV_SERVER_WS_PORT) ||
    (await getPort({ port: Number(appConfig.devServerPort) || 8002 }));
  // set env variable so un-bundled servers can use it
  process.env.REMIX_DEV_SERVER_WS_PORT = String(devServerPort);
  let devServerBroadcastDelay = appConfig.devServerBroadcastDelay || 0;

  let defaultPublicPath =
    appConfig.serverBuildTarget === "arc" ? "/_static/build/" : "/build/";
  let publicPath = addTrailingSlash(appConfig.publicPath || defaultPublicPath);

  let rootRouteFile = findEntry(appDirectory, "root");
  if (!rootRouteFile) {
    throw new Error(`Missing "root" route file in ${appDirectory}`);
  }

  let routes: RouteManifest = {
    root: { path: "", id: "root", file: rootRouteFile },
  };

  let routesConvention: typeof flatRoutes;

  if (appConfig.future?.v2_routeConvention) {
    routesConvention = flatRoutes;
  } else {
    flatRoutesWarning();
    routesConvention = defineConventionalRoutes;
  }

  if (fse.existsSync(path.resolve(appDirectory, "routes"))) {
    let conventionalRoutes = routesConvention(
      appDirectory,
      appConfig.ignoredRouteFiles
    );
    for (let route of Object.values(conventionalRoutes)) {
      routes[route.id] = { ...route, parentId: route.parentId || "root" };
    }
  }
  if (appConfig.routes) {
    let manualRoutes = await appConfig.routes(defineRoutes);
    for (let route of Object.values(manualRoutes)) {
      routes[route.id] = { ...route, parentId: route.parentId || "root" };
    }
  }

  let watchPaths: string[] = [];
  if (typeof appConfig.watchPaths === "function") {
    let directories = await appConfig.watchPaths();
    watchPaths = watchPaths.concat(
      Array.isArray(directories) ? directories : [directories]
    );
  } else if (appConfig.watchPaths) {
    watchPaths = watchPaths.concat(
      Array.isArray(appConfig.watchPaths)
        ? appConfig.watchPaths
        : [appConfig.watchPaths]
    );
  }

  // When tsconfigPath is undefined, the default "tsconfig.json" is not
  // found in the root directory.
  let tsconfigPath: string | undefined;
  let rootTsconfig = path.resolve(rootDirectory, "tsconfig.json");
  let rootJsConfig = path.resolve(rootDirectory, "jsconfig.json");

  if (fse.existsSync(rootTsconfig)) {
    tsconfigPath = rootTsconfig;
  } else if (fse.existsSync(rootJsConfig)) {
    tsconfigPath = rootJsConfig;
  }

  let future: FutureConfig = {
    v2_dev: appConfig.future?.v2_dev ?? false,
    unstable_postcss: appConfig.future?.unstable_postcss === true,
    unstable_tailwind: appConfig.future?.unstable_tailwind === true,
    v2_errorBoundary: appConfig.future?.v2_errorBoundary === true,
    v2_headers: appConfig.future?.v2_headers === true,
    v2_meta: appConfig.future?.v2_meta === true,
    v2_normalizeFormMethod: appConfig.future?.v2_normalizeFormMethod === true,
    v2_routeConvention: appConfig.future?.v2_routeConvention === true,
  };

  return {
    appDirectory,
    cacheDirectory,
    entryClientFile,
    entryClientFilePath,
    entryServerFile,
    entryServerFilePath,
    devServerPort,
    devServerBroadcastDelay,
    assetsBuildDirectory: absoluteAssetsBuildDirectory,
    relativeAssetsBuildDirectory: assetsBuildDirectory,
    publicPath,
    rootDirectory,
    routes,
    serverBuildPath,
    serverBuildTarget,
    serverBuildTargetEntryModule,
    serverConditions,
    serverDependenciesToBundle,
    serverEntryPoint,
    serverMainFields,
    serverMinify,
    serverMode,
    serverModuleFormat,
    serverNodeBuiltinsPolyfill,
    serverPlatform,
    mdx,
    postcss,
    tailwind,
    watchPaths,
    tsconfigPath,
    future,
  };
}

function addTrailingSlash(path: string): string {
  return path.endsWith("/") ? path : path + "/";
}

const entryExts = [".js", ".jsx", ".ts", ".tsx"];

function findEntry(dir: string, basename: string): string | undefined {
  for (let ext of entryExts) {
    let file = path.resolve(dir, basename + ext);
    if (fse.existsSync(file)) return path.relative(dir, file);
  }

  return undefined;
}

const configExts = [".js", ".cjs", ".mjs"];

export function findConfig(
  dir: string,
  basename: string,
  extensions: string[]
): string | undefined {
  for (let ext of extensions) {
    let name = basename + ext;
    let file = path.join(dir, name);
    if (fse.existsSync(file)) return file;
  }

  return undefined;
}

const resolveServerBuildPath = (
  rootDirectory: string,
  appConfig: AppConfig
) => {
  let serverBuildPath = "build/index.js";

  switch (appConfig.serverBuildTarget) {
    case "arc":
      serverBuildPath = "server/index.js";
      break;
    case "cloudflare-pages":
      serverBuildPath = "functions/[[path]].js";
      break;
    case "netlify":
      serverBuildPath = ".netlify/functions-internal/server.js";
      break;
    case "vercel":
      serverBuildPath = "api/index.js";
      break;
  }

  // retain deprecated behavior for now
  if (appConfig.serverBuildDirectory) {
    serverBuildDirectoryWarning();

    serverBuildPath = path.join(appConfig.serverBuildDirectory, "index.js");
  }

  if (appConfig.serverBuildPath) {
    serverBuildPath = appConfig.serverBuildPath;
  }

  return path.resolve(rootDirectory, serverBuildPath);
};

// adds types for `Intl.ListFormat` to the global namespace
// we could also update our `tsconfig.json` to include `lib: ["es2021"]`
declare namespace Intl {
  type ListType = "conjunction" | "disjunction";

  interface ListFormatOptions {
    localeMatcher?: "lookup" | "best fit";
    type?: ListType;
    style?: "long" | "short" | "narrow";
  }

  interface ListFormatPart {
    type: "element" | "literal";
    value: string;
  }

  class ListFormat {
    constructor(locales?: string | string[], options?: ListFormatOptions);
    format(values: any[]): string;
    formatToParts(values: any[]): ListFormatPart[];
    supportedLocalesOf(
      locales: string | string[],
      options?: ListFormatOptions
    ): string[];
  }
}

let conjunctionListFormat = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

let disjunctionListFormat = new Intl.ListFormat("en", {
  style: "long",
  type: "disjunction",
});

let browserBuildDirectoryWarning = () =>
  logger.warn(
    "The `browserBuildDirectory` config option will be removed in v2",
    {
      details: [
        "You can use the `assetsBuildDirectory` config option instead.",
        "-> https://remix.run/docs/en/v1.15.0/pages/v2#browserbuilddirectory",
      ],
      key: "browserBuildDirectoryWarning",
    }
  );

let devServerBroadcastDelayWarning = () =>
  logger.warn(
    "The `devServerBroadcastDelay` config option will be removed in v2",
    {
      details: [
        "Enable `v2_dev` to eliminate the race conditions that necessitated this option.",
        "-> https://remix.run/docs/en/v1.19.3/pages/v2#devserverbroadcastdelay",
      ],
      key: "devServerBroadcastDelayWarning",
    }
  );

let devServerPortWarning = () =>
  logger.warn("The `devServerPort` config option will be removed in v2", {
    details: [
      "Enable `v2_dev` and use `--port` / `v2_dev.port` option instead.",
      "-> https://remix.run/docs/en/v1.19.3/pages/v2#devserverport",
    ],
    key: "devServerPortWarning",
  });

let serverBuildDirectoryWarning = () =>
  logger.warn(
    "The `serverBuildDirectory` config option will be removed in v2",
    {
      details: [
        "You can use the `serverBuildPath` config option instead.",
        "-> https://remix.run/docs/en/v1.15.0/pages/v2#serverbuilddirectory",
      ],
      key: "serverBuildDirectoryWarning",
    }
  );

let serverBuildTargetWarning = () =>
  logger.warn("The `serverBuildTarget` config option will be removed in v2", {
    details: [
      "You can specify multiple server module config options instead to achieve the same result.",
      "-> https://remix.run/docs/en/v1.15.0/pages/v2#serverbuildtarget",
    ],
    key: "serverBuildTargetWarning",
  });

let serverModuleFormatWarning = () =>
  logger.warn("The default server module format is changing in v2", {
    details: [
      "The default format will change from `cjs` to `esm`.",
      "You can keep using `cjs` by explicitly specifying `serverModuleFormat: 'cjs'`.",
      "You can opt-in early to this change by explicitly specifying `serverModuleFormat: 'esm'`",
      "-> https://remix.run/docs/en/v1.16.0/pages/v2#servermoduleformat",
    ],
    key: "serverModuleFormatWarning",
  });

let serverNodeBuiltinsPolyfillWarning = () =>
  logger.warn(
    "The `serverNodeBuiltinsPolyfill` config default option will be changing in v2",
    {
      details: [
        "Server polyfills will no longer be provided by default for non-Node.js platforms.",
        "You can prepare for this change by specifying server polyfills, or opting out entirely.",
        "-> https://remix.run/docs/en/v1.19.0/pages/v2#servernodebuiltinspolyfill",
      ],
      key: "serverNodeBuiltinsPolyfillWarning",
    }
  );

let futureFlagWarning =
  (args: { message: string; flag: string; link: string }) => () => {
    logger.warn(args.message, {
      key: args.flag,
      details: [
        `You can use the \`${args.flag}\` future flag to opt-in early.`,
        `-> ${args.link}`,
      ],
    });
  };

let flatRoutesWarning = futureFlagWarning({
  message: "The route file convention is changing in v2",
  flag: "v2_routeConvention",
  link: "https://remix.run/docs/en/v1.15.0/pages/v2#file-system-route-convention",
});

let errorBoundaryWarning = futureFlagWarning({
  message: "The `CatchBoundary` and `ErrorBoundary` API is changing in v2",
  flag: "v2_errorBoundary",
  link: "https://remix.run/docs/en/v1.15.0/pages/v2#catchboundary-and-errorboundary",
});

let formMethodWarning = futureFlagWarning({
  message: "The `formMethod` API is changing in v2",
  flag: "v2_normalizeFormMethod",
  link: "https://remix.run/docs/en/v1.15.0/pages/v2#formMethod",
});

let metaWarning = futureFlagWarning({
  message: "The route `meta` API is changing in v2",
  flag: "v2_meta",
  link: "https://remix.run/docs/en/v1.15.0/pages/v2#meta",
});

let headersWarning = futureFlagWarning({
  message: "The route `headers` API is changing in v2",
  flag: "v2_headers",
  link: "https://remix.run/docs/en/v1.17.0/pages/v2#route-headers",
});
