import { type RemixConfig } from "../config";
import { type AssetsManifest } from "./assets";
import { type BrowserCompiler, createBrowserCompiler } from "./compileBrowser";
import { type ServerCompiler, createServerCompiler } from "./compilerServer";
import { type OnCompileFailure } from "./onCompileFailure";
import { type CompileOptions } from "./options";
import { createChannel } from "./utils/channel";

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

export const compile = async (
  compiler: RemixCompiler,
  options: {
    onCompileFailure?: OnCompileFailure;
  } = {}
): Promise<void> => {
  try {
    let assetsManifestChannel = createChannel<AssetsManifest>();
    let browserPromise = compiler.browser.compile(assetsManifestChannel);
    let serverPromise = compiler.server.compile(assetsManifestChannel);
    await Promise.all([browserPromise, serverPromise]);
  } catch (err) {
    options.onCompileFailure?.(err as Error);
  }
};

export const dispose = (compiler: RemixCompiler): void => {
  compiler.browser.dispose();
  compiler.server.dispose();
};
