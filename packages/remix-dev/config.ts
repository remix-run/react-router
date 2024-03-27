import { execSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import fse from "fs-extra";
import PackageJson from "@npmcli/package-json";
import type { NodePolyfillsOptions as EsbuildPluginsNodeModulesPolyfillOptions } from "esbuild-plugins-node-modules-polyfill";

import type { RouteManifest, DefineRoutesFunction } from "./config/routes";
import { defineRoutes } from "./config/routes";
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

export type ServerModuleFormat = "esm" | "cjs";
export type ServerPlatform = "node" | "neutral";

type Dev = {
  command?: string;
  manual?: boolean;
  port?: number;
  tlsKey?: string;
  tlsCert?: string;
};

interface FutureConfig {
  v3_fetcherPersist: boolean;
  v3_relativeSplatPath: boolean;
  v3_throwAbortReason: boolean;
  unstable_singleFetch: boolean;
}

type NodeBuiltinsPolyfillOptions = Pick<
  EsbuildPluginsNodeModulesPolyfillOptions,
  "modules" | "globals"
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
  ) =>
    | ReturnType<DefineRoutesFunction>
    | Promise<ReturnType<DefineRoutesFunction>>;

  /**
   * The path to the browser build, relative to `remix.config.js`. Defaults to
   * "public/build".
   */
  assetsBuildDirectory?: string;

  /**
   * The URL prefix of the browser build with a trailing slash. Defaults to
   * `"/build/"`. This is the path the browser will use to find assets.
   */
  publicPath?: string;

  /**
   * Options for `remix dev`. See https://remix.run/other-api/dev#options-1
   */
  dev?: Dev;

  /**
   * Additional MDX remark / rehype plugins.
   */
  mdx?: RemixMdxConfig | RemixMdxConfigFunction;

  /**
   * Whether to process CSS using PostCSS if a PostCSS config file is present.
   * Defaults to `true`.
   */
  postcss?: boolean;

  /**
   * A server entrypoint, relative to the root directory that becomes your
   * server's main module. If specified, Remix will compile this file along with
   * your application into a single file to be deployed to your server. This
   * file can use either a `.ts` or `.js` file extension.
   */
  server?: string;

  /**
   * The path to the server build file, relative to `remix.config.js`. This file
   * should end in a `.js` extension and should be deployed to your server.
   */
  serverBuildPath?: string;

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
   * The output format of the server build. Defaults to "esm".
   */
  serverModuleFormat?: ServerModuleFormat;

  /**
   * The Node.js polyfills to include in the server build when targeting
   * non-Node.js server platforms.
   */
  serverNodeBuiltinsPolyfill?: NodeBuiltinsPolyfillOptions;

  /**
   * The Node.js polyfills to include in the browser build.
   */
  browserNodeBuiltinsPolyfill?: NodeBuiltinsPolyfillOptions;

  /**
   * The platform the server build is targeting. Defaults to "node".
   */
  serverPlatform?: ServerPlatform;

  /**
   * Whether to support Tailwind functions and directives in CSS files if
   * `tailwindcss` is installed. Defaults to `true`.
   */
  tailwind?: boolean;

  /**
   * A list of filenames or a glob patterns to match files in the `app/routes`
   * directory that Remix will ignore. Matching files will not be recognized as
   * routes.
   */
  ignoredRouteFiles?: string[];

  /**
   * A function for defining custom directories to watch while running `remix dev`,
   * in addition to `appDirectory`.
   */
  watchPaths?:
    | string
    | string[]
    | (() => Promise<string | string[]> | string | string[]);

  /**
   * Enabled future flags
   */
  future?: [keyof FutureConfig] extends [never]
    ? // Partial<FutureConfig> doesn't work when it's empty so just prevent any keys
      { [key: string]: never }
    : Partial<FutureConfig>;
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
   * Options for `remix dev`. See https://remix.run/other-api/dev#options-1
   */
  dev: Dev;

  /**
   * Additional MDX remark / rehype plugins.
   */
  mdx?: RemixMdxConfig | RemixMdxConfigFunction;

  /**
   * Whether to process CSS using PostCSS if a PostCSS config file is present.
   * Defaults to `true`.
   */
  postcss: boolean;

  /**
   * The path to the server build file. This file should end in a `.js`.
   */
  serverBuildPath: string;

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
   * The output format of the server build. Defaults to "esm".
   */
  serverModuleFormat: ServerModuleFormat;

  /**
   * The Node.js polyfills to include in the server build when targeting
   * non-Node.js server platforms.
   */
  serverNodeBuiltinsPolyfill?: NodeBuiltinsPolyfillOptions;

  /**
   * The Node.js polyfills to include in the browser build.
   */
  browserNodeBuiltinsPolyfill?: NodeBuiltinsPolyfillOptions;

  /**
   * The platform the server build is targeting. Defaults to "node".
   */
  serverPlatform: ServerPlatform;

  /**
   * Whether to support Tailwind functions and directives in CSS files if `tailwindcss` is installed.
   * Defaults to `true`.
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
  serverMode?: ServerMode
): Promise<RemixConfig> {
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
        // dynamic import does not currently work inside vm which
        // jest relies on, so we fall back to require for this case
        // https://github.com/nodejs/node/issues/35889
        appConfigModule = require(configFile);
      } else {
        let stat = fse.statSync(configFile);
        appConfigModule = await import(
          pathToFileURL(configFile).href + "?t=" + stat.mtimeMs
        );
      }
      appConfig = appConfigModule?.default || appConfigModule;
    } catch (error: unknown) {
      throw new Error(
        `Error loading Remix config at ${configFile}\n${String(error)}`
      );
    }
  }

  return await resolveConfig(appConfig, {
    rootDirectory,
    serverMode,
  });
}

export async function resolveConfig(
  appConfig: AppConfig,
  {
    rootDirectory,
    serverMode = ServerMode.Production,
    isSpaMode = false,
  }: {
    rootDirectory: string;
    serverMode?: ServerMode;
    isSpaMode?: boolean;
  }
): Promise<RemixConfig> {
  if (!isValidServerMode(serverMode)) {
    throw new Error(`Invalid server mode "${serverMode}"`);
  }

  let serverBuildPath = path.resolve(
    rootDirectory,
    appConfig.serverBuildPath ?? "build/index.js"
  );
  let serverBuildTargetEntryModule = `export * from ${JSON.stringify(
    serverBuildVirtualModule.id
  )};`;
  let serverConditions = appConfig.serverConditions;
  let serverDependenciesToBundle = appConfig.serverDependenciesToBundle || [];
  let serverEntryPoint = appConfig.server;
  let serverMainFields = appConfig.serverMainFields;
  let serverMinify = appConfig.serverMinify;

  let serverModuleFormat = appConfig.serverModuleFormat || "esm";
  let serverPlatform = appConfig.serverPlatform || "node";
  serverMainFields ??=
    serverModuleFormat === "esm" ? ["module", "main"] : ["main", "module"];
  serverMinify ??= false;

  let serverNodeBuiltinsPolyfill = appConfig.serverNodeBuiltinsPolyfill;
  let browserNodeBuiltinsPolyfill = appConfig.browserNodeBuiltinsPolyfill;
  let mdx = appConfig.mdx;
  let postcss = appConfig.postcss ?? true;
  let tailwind = appConfig.tailwind ?? true;

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
  let entryClientFile = userEntryClientFile || "entry.client.tsx";

  let pkgJson = await PackageJson.load(rootDirectory);
  let deps = pkgJson.content.dependencies ?? {};

  if (isSpaMode && appConfig.future?.unstable_singleFetch != true) {
    // This is a super-simple default since we don't need streaming in SPA Mode.
    // We can include this in a remix-spa template, but right now `npx remix reveal`
    // will still expose the streaming template since that command doesn't have
    // access to the `ssr:false` flag in the vite config (the streaming template
    // works just fine so maybe instea dof having this we _only have this version
    // in the template...).  We let users manage an entry.server file in SPA Mode
    // so they can de ide if they want to hydrate the full document or just an
    // embedded `<div id="app">` or whatever.
    entryServerFile = "entry.server.spa.tsx";
  } else if (userEntryServerFile) {
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

    if (!deps["isbot"]) {
      console.log(
        "adding `isbot` to your package.json, you should commit this change"
      );

      pkgJson.update({
        dependencies: {
          ...pkgJson.content.dependencies,
          isbot: "^4",
        },
      });

      await pkgJson.save();

      let packageManager = detectPackageManager() ?? "npm";

      execSync(`${packageManager} install`, {
        cwd: rootDirectory,
        stdio: "inherit",
      });
    }

    entryServerFile = `entry.server.${serverRuntime}.tsx`;
  }

  let entryClientFilePath = userEntryClientFile
    ? path.resolve(appDirectory, userEntryClientFile)
    : path.resolve(defaultsDirectory, entryClientFile);

  let entryServerFilePath = userEntryServerFile
    ? path.resolve(appDirectory, userEntryServerFile)
    : path.resolve(defaultsDirectory, entryServerFile);

  let assetsBuildDirectory =
    appConfig.assetsBuildDirectory || path.join("public", "build");

  let absoluteAssetsBuildDirectory = path.resolve(
    rootDirectory,
    assetsBuildDirectory
  );

  let publicPath = addTrailingSlash(appConfig.publicPath || "/build/");

  let rootRouteFile = findEntry(appDirectory, "root");
  if (!rootRouteFile) {
    throw new Error(`Missing "root" route file in ${appDirectory}`);
  }

  let routes: RouteManifest = {
    root: { path: "", id: "root", file: rootRouteFile },
  };

  if (fse.existsSync(path.resolve(appDirectory, "routes"))) {
    let fileRoutes = flatRoutes(appDirectory, appConfig.ignoredRouteFiles);
    for (let route of Object.values(fileRoutes)) {
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

  // Note: When a future flag is removed from here, it should be added to the
  // list below, so we can let folks know if they have obsolete flags in their
  // config.  If we ever convert remix.config.js to a TS file, so we get proper
  // typings this won't be necessary anymore.
  let future: FutureConfig = {
    v3_fetcherPersist: appConfig.future?.v3_fetcherPersist === true,
    v3_relativeSplatPath: appConfig.future?.v3_relativeSplatPath === true,
    v3_throwAbortReason: appConfig.future?.v3_throwAbortReason === true,
    unstable_singleFetch: appConfig.future?.unstable_singleFetch === true,
  };

  if (appConfig.future) {
    let userFlags = appConfig.future;
    let deprecatedFlags = [
      "unstable_cssModules",
      "unstable_cssSideEffectImports",
      "unstable_dev",
      "unstable_postcss",
      "unstable_tailwind",
      "unstable_vanillaExtract",
      "v2_errorBoundary",
      "v2_headers",
      "v2_meta",
      "v2_normalizeFormMethod",
      "v2_routeConvention",
    ];

    if ("v2_dev" in userFlags) {
      if (userFlags.v2_dev === true) {
        deprecatedFlags.push("v2_dev");
      } else {
        logger.warn("The `v2_dev` future flag is obsolete.", {
          details: [
            "Move your dev options from `future.v2_dev` to `dev` within your `remix.config.js` file",
          ],
        });
      }
    }

    let obsoleteFlags = deprecatedFlags.filter((f) => f in userFlags);
    if (obsoleteFlags.length > 0) {
      logger.warn(
        `The following Remix future flags are now obsolete ` +
          `and can be removed from your remix.config.js file:\n` +
          obsoleteFlags.map((f) => `- ${f}\n`).join("")
      );
    }
  }

  return {
    appDirectory,
    cacheDirectory,
    entryClientFile,
    entryClientFilePath,
    entryServerFile,
    entryServerFilePath,
    dev: appConfig.dev ?? {},
    assetsBuildDirectory: absoluteAssetsBuildDirectory,
    relativeAssetsBuildDirectory: assetsBuildDirectory,
    publicPath,
    rootDirectory,
    routes,
    serverBuildPath,
    serverBuildTargetEntryModule,
    serverConditions,
    serverDependenciesToBundle,
    serverEntryPoint,
    serverMainFields,
    serverMinify,
    serverMode,
    serverModuleFormat,
    serverNodeBuiltinsPolyfill,
    browserNodeBuiltinsPolyfill,
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

let disjunctionListFormat = new Intl.ListFormat("en", {
  style: "long",
  type: "disjunction",
});
