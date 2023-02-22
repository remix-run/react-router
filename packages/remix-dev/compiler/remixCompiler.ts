import type esbuild from "esbuild";

import { createChannel } from "../channel";
import type { RemixConfig } from "../config";
import type { AssetsManifest } from "./assets";
import type { BrowserCompiler } from "./compileBrowser";
import { createBrowserCompiler } from "./compileBrowser";
import type { ServerCompiler } from "./compilerServer";
import { createServerCompiler } from "./compilerServer";
import type { OnCompileFailure } from "./onCompileFailure";
import type { CompileOptions } from "./options";

type RemixCompiler = {
  browser: BrowserCompiler;
  server: ServerCompiler;
};

export const createRemixCompiler = (
  remixConfig: RemixConfig,
  options: CompileOptions
): RemixCompiler => {
  return {
    browser: createBrowserCompiler(remixConfig, options),
    server: createServerCompiler(remixConfig, options),
  };
};

export type CompileResult = {
  assetsManifest: AssetsManifest;
  metafile: {
    browser: esbuild.Metafile;
    server: esbuild.Metafile;
  };
};

export const compile = async (
  compiler: RemixCompiler,
  options: {
    onCompileFailure?: OnCompileFailure;
  } = {}
): Promise<CompileResult | undefined> => {
  try {
    let assetsManifestChannel = createChannel<AssetsManifest>();
    let browserPromise = compiler.browser.compile(assetsManifestChannel);
    let serverPromise = compiler.server.compile(assetsManifestChannel);
    return {
      assetsManifest: await assetsManifestChannel.read(),
      metafile: {
        browser: await browserPromise,
        server: await serverPromise,
      },
    };
  } catch (error: unknown) {
    options.onCompileFailure?.(error as Error);
    return undefined;
  }
};

export const dispose = (compiler: RemixCompiler): void => {
  compiler.browser.dispose();
  compiler.server.dispose();
};
