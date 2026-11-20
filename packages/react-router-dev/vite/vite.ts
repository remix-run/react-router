import { createRequire } from "node:module";
import path from "pathe";
import type {
  DepOptimizationConfig,
  ESBuildOptions,
  EnvironmentOptions,
  BuildEnvironmentOptions,
} from "vite";

import invariant from "../invariant";
import { isReactRouterRepo } from "../config/is-react-router-repo";

const nodeRequire = createRequire(import.meta.url);

type Vite = typeof import("vite");
let vite: Vite | undefined;

const viteImportSpecifier = isReactRouterRepo()
  ? // Support testing against different versions of Vite by ensuring that Vite
    // is resolved from the current working directory when running within this
    // repo. If we don't do this, Vite will always be imported relative to this
    // file, which means that it will always resolve to the repo's Vite version.
    `file:///${path
      .normalize(
        nodeRequire.resolve("vite/package.json", { paths: [process.cwd()] }),
      )
      .replace("package.json", "dist/node/index.js")}`
  : "vite";

export async function preloadVite(): Promise<void> {
  // Use a dynamic import to force Vite to use the ESM build. If we don't do
  // this, Vite logs CJS deprecation warnings.
  vite = await import(viteImportSpecifier);
}

export function getVite(): Vite {
  invariant(vite, "getVite() called before preloadVite()");
  return vite;
}

type OxcCompilerOptions = {
  jsx: {
    runtime: "automatic";
    development: boolean;
  };
};

type RolldownJsxOptions = "react-jsx";
type RolldownOptimizeDepsOptions = {
  transform: {
    jsx: RolldownJsxOptions;
  };
  plugins?: unknown[];
};

type OptimizeDepsESBuildOptions = NonNullable<
  DepOptimizationConfig["esbuildOptions"]
>;

export function defineCompilerOptions(options: {
  oxc: OxcCompilerOptions;
  esbuild: ESBuildOptions;
}): { oxc: OxcCompilerOptions } | { esbuild: ESBuildOptions } {
  let vite = getVite();
  return parseInt(vite.version.split(".")[0], 10) >= 8
    ? { oxc: options.oxc }
    : { esbuild: options.esbuild };
}

export function defineOptimizeDepsCompilerOptions(options: {
  rolldown: RolldownOptimizeDepsOptions;
  esbuild: OptimizeDepsESBuildOptions;
}):
  | { rolldownOptions: RolldownOptimizeDepsOptions }
  | { esbuildOptions: OptimizeDepsESBuildOptions } {
  let vite = getVite();
  return parseInt(vite.version.split(".")[0], 10) >= 8
    ? { rolldownOptions: options.rolldown }
    : { esbuildOptions: options.esbuild };
}

/**
 * Read the user-supplied build options from either `rollupOptions` (Vite <=7)
 * or `rolldownOptions` (Vite >=8).
 */
export function getUserBuildRollupOptions(
  environment: EnvironmentOptions | undefined,
): BuildEnvironmentOptions["rollupOptions"] | undefined {
  if (environment?.build) {
    if ("rollupOptions" in environment.build) {
      return environment.build.rollupOptions;
    }
    if ("rolldownOptions" in environment.build) {
      return environment.build
        .rolldownOptions as BuildEnvironmentOptions["rollupOptions"];
    }
  }
  return undefined;
}
