// We can only import types from Vite at the top level since we're in a CJS
// context but want to use Vite's ESM build to avoid deprecation warnings
import * as fse from "fs-extra";
import * as path from "node:path";
import colors from "picocolors";
import type * as Vite from "vite";
import type { ResolvedReactRouterConfig } from "../config/config";
import type { RouteManifest } from "../config/routes";
import type { Manifest as ReactRouterManifest } from "../manifest";

export type ServerBundleBuildConfig = {
  routes: RouteManifest;
  serverBundleId: string;
};

export type ReactRouterPluginSsrBuildContext =
  | {
      isSsrBuild: false;
      getReactRouterServerManifest?: never;
      serverBundleBuildConfig?: never;
    }
  | {
      isSsrBuild: true;
      getReactRouterServerManifest: () => Promise<ReactRouterManifest>;
      serverBundleBuildConfig: ServerBundleBuildConfig | null;
    };

export type ReactRouterPluginContext = ReactRouterPluginSsrBuildContext & {
  rootDirectory: string;
  entryClientFilePath: string;
  entryServerFilePath: string;
  publicPath: string;
  reactRouterConfig: ResolvedReactRouterConfig;
  viteManifestEnabled: boolean;
};

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

export async function resolveViteConfig({
  configFile,
  mode,
  root,
}: {
  configFile?: string;
  mode?: string;
  root: string;
}) {
  let vite = await import("vite");

  let viteConfig = await vite.resolveConfig(
    { mode, configFile, root },
    "build", // command
    "production", // default mode
    "production" // default NODE_ENV
  );

  if (typeof viteConfig.build.manifest === "string") {
    throw new Error("Custom Vite manifest paths are not supported");
  }

  return viteConfig;
}

export async function extractPluginContext(viteConfig: Vite.ResolvedConfig) {
  return viteConfig["__reactRouterPluginContext" as keyof typeof viteConfig] as
    | ReactRouterPluginContext
    | undefined;
}

export async function loadPluginContext({
  configFile,
  root,
}: {
  configFile?: string;
  root?: string;
}) {
  if (!root) {
    root = process.env.REACT_ROUTER_ROOT || process.cwd();
  }

  configFile =
    configFile ??
    findConfig(root, "vite.config", [
      ".ts",
      ".cts",
      ".mts",
      ".js",
      ".cjs",
      ".mjs",
    ]);

  if (!configFile) {
    console.error(colors.red("Vite config file not found"));
    process.exit(1);
  }

  let viteConfig = await resolveViteConfig({ configFile, root });
  let ctx = await extractPluginContext(viteConfig);

  if (!ctx) {
    console.error(
      colors.red("React Router Vite plugin not found in Vite config")
    );
    process.exit(1);
  }

  return ctx;
}
