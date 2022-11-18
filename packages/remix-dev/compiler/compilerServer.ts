import * as path from "path";
import * as esbuild from "esbuild";
import * as fse from "fs-extra";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

import { type ReadChannel } from "../channel";
import { type RemixConfig } from "../config";
import { type AssetsManifest } from "./assets";
import { loaders } from "./loaders";
import { type CompileOptions } from "./options";
import { cssFilePlugin } from "./plugins/cssFilePlugin";
import { emptyModulesPlugin } from "./plugins/emptyModulesPlugin";
import { mdxPlugin } from "./plugins/mdx";
import { serverAssetsManifestPlugin } from "./plugins/serverAssetsManifestPlugin";
import { serverBareModulesPlugin } from "./plugins/serverBareModulesPlugin";
import { serverEntryModulePlugin } from "./plugins/serverEntryModulePlugin";
import { serverRouteModulesPlugin } from "./plugins/serverRouteModulesPlugin";
import { urlImportsPlugin } from "./plugins/urlImportsPlugin";

export type ServerCompiler = {
  // produce ./build/index.js
  compile: (manifestChannel: ReadChannel<AssetsManifest>) => Promise<void>;
  dispose: () => void;
};

const createEsbuildConfig = (
  config: RemixConfig,
  assetsManifestChannel: ReadChannel<AssetsManifest>,
  options: CompileOptions
): esbuild.BuildOptions => {
  let stdin: esbuild.StdinOptions | undefined;
  let entryPoints: string[] | undefined;

  if (config.serverEntryPoint) {
    entryPoints = [config.serverEntryPoint];
  } else {
    stdin = {
      contents: config.serverBuildTargetEntryModule,
      resolveDir: config.rootDirectory,
      loader: "ts",
    };
  }

  let isCloudflareRuntime = ["cloudflare-pages", "cloudflare-workers"].includes(
    config.serverBuildTarget ?? ""
  );
  let isDenoRuntime = config.serverBuildTarget === "deno";

  let plugins: esbuild.Plugin[] = [
    cssFilePlugin(options),
    urlImportsPlugin(),
    mdxPlugin(config),
    emptyModulesPlugin(config, /\.client(\.[jt]sx?)?$/),
    serverRouteModulesPlugin(config),
    serverEntryModulePlugin(config),
    serverAssetsManifestPlugin(assetsManifestChannel.read()),
    serverBareModulesPlugin(config, options.onWarning),
  ];

  if (config.serverPlatform !== "node") {
    plugins.unshift(NodeModulesPolyfillPlugin());
  }

  return {
    absWorkingDir: config.rootDirectory,
    stdin,
    entryPoints,
    outfile: config.serverBuildPath,
    conditions: isCloudflareRuntime
      ? ["worker"]
      : isDenoRuntime
      ? ["deno", "worker"]
      : undefined,
    platform: config.serverPlatform,
    format: config.serverModuleFormat,
    treeShaking: true,
    // The type of dead code elimination we want to do depends on the
    // minify syntax property: https://github.com/evanw/esbuild/issues/672#issuecomment-1029682369
    // Dev builds are leaving code that should be optimized away in the
    // bundle causing server / testing code to be shipped to the browser.
    // These are properly optimized away in prod builds today, and this
    // PR makes dev mode behave closer to production in terms of dead
    // code elimination / tree shaking is concerned.
    minifySyntax: true,
    minify: options.mode === "production" && isCloudflareRuntime,
    mainFields: isCloudflareRuntime
      ? ["browser", "module", "main"]
      : config.serverModuleFormat === "esm"
      ? ["module", "main"]
      : ["main", "module"],
    target: options.target,
    loader: loaders,
    bundle: true,
    logLevel: "silent",
    // As pointed out by https://github.com/evanw/esbuild/issues/2440, when tsconfig is set to
    // `undefined`, esbuild will keep looking for a tsconfig.json recursively up. This unwanted
    // behavior can only be avoided by creating an empty tsconfig file in the root directory.
    tsconfig: config.tsconfigPath,
    sourcemap: options.sourcemap, // use linked (true) to fix up .map file
    // The server build needs to know how to generate asset URLs for imports
    // of CSS and other files.
    assetNames: "_assets/[name]-[hash]",
    publicPath: config.publicPath,
    define: {
      "process.env.NODE_ENV": JSON.stringify(options.mode),
      "process.env.REMIX_DEV_SERVER_WS_PORT": JSON.stringify(
        config.devServerPort
      ),
    },
    jsx: "automatic",
    jsxDev: options.mode !== "production",
    plugins,
  };
};

async function writeServerBuildResult(
  config: RemixConfig,
  outputFiles: esbuild.OutputFile[]
) {
  await fse.ensureDir(path.dirname(config.serverBuildPath));

  for (let file of outputFiles) {
    if (file.path.endsWith(".js")) {
      // fix sourceMappingURL to be relative to current path instead of /build
      let filename = file.path.substring(file.path.lastIndexOf(path.sep) + 1);
      let escapedFilename = filename.replace(/\./g, "\\.");
      let pattern = `(//# sourceMappingURL=)(.*)${escapedFilename}`;
      let contents = Buffer.from(file.contents).toString("utf-8");
      contents = contents.replace(new RegExp(pattern), `$1${filename}`);
      await fse.writeFile(file.path, contents);
    } else if (file.path.endsWith(".map")) {
      // remove route: prefix from source filenames so breakpoints work
      let contents = Buffer.from(file.contents).toString("utf-8");
      contents = contents.replace(/"route:/gm, '"');
      await fse.writeFile(file.path, contents);
    } else {
      let assetPath = path.join(
        config.assetsBuildDirectory,
        file.path.replace(path.dirname(config.serverBuildPath), "")
      );
      await fse.ensureDir(path.dirname(assetPath));
      await fse.writeFile(assetPath, file.contents);
    }
  }
}

export const createServerCompiler = (
  remixConfig: RemixConfig,
  options: CompileOptions
): ServerCompiler => {
  let compile = async (manifestChannel: ReadChannel<AssetsManifest>) => {
    let esbuildConfig = createEsbuildConfig(
      remixConfig,
      manifestChannel,
      options
    );
    let { outputFiles } = await esbuild.build({
      ...esbuildConfig,
      write: false,
    });
    await writeServerBuildResult(remixConfig, outputFiles!);
  };
  return {
    compile,
    dispose: () => undefined,
  };
};
