import type { Plugin } from "esbuild";

import type { RemixConfig, VanillaExtractOptions } from "../../config";
import type { CompileOptions } from "../options";
import { vanillaExtractPluginCached } from "./vanillaExtractPluginCached";
import { vanillaExtractPluginUncached } from "./vanillaExtractPluginUncached";

export function vanillaExtractPlugin(options: {
  config: RemixConfig;
  mode: CompileOptions["mode"];
  outputCss: boolean;
}): Plugin {
  let defaultPluginOptions: Required<VanillaExtractOptions> = {
    cache: false,
  };

  let futureFlag = options.config.future.unstable_vanillaExtract;
  let pluginOptions = typeof futureFlag === "object" ? futureFlag : {};

  let { cache } = {
    ...defaultPluginOptions,
    ...pluginOptions,
  };

  let resolvedPlugin = cache
    ? vanillaExtractPluginCached
    : vanillaExtractPluginUncached;

  return resolvedPlugin(options);
}
