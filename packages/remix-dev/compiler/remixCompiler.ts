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

    // await browser/server _before_ assets manifest channel
    // to fix https://github.com/remix-run/remix/issues/5631
    // this is temporary and is actively being refactored
    let browser = await browserPromise;
    let server = await serverPromise;
    return {
      assetsManifest: await assetsManifestChannel.read(),
      metafile: {
        browser,
        server,
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
