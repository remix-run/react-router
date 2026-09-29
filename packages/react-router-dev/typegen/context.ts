import type { ChokidarOptions } from "chokidar";

import {
  createConfigLoader,
  type ConfigLoader,
  type ResolvedReactRouterConfig,
} from "../config/config";

export type Context = {
  rootDirectory: string;
  configLoader: ConfigLoader;
  config: ResolvedReactRouterConfig;
  rsc: boolean;
};

export async function createContext({
  rootDirectory,
  watch,
  watchOptions,
  mode,
  rsc,
}: {
  rootDirectory: string;
  watch: boolean;
  watchOptions?: ChokidarOptions;
  mode: string;
  rsc: boolean;
}): Promise<Context> {
  const configLoader = await createConfigLoader({
    rootDirectory,
    mode,
    watch,
    watchOptions,
  });
  const configResult = await configLoader.getConfig();

  if (!configResult.ok) {
    throw new Error(configResult.error);
  }

  const config = configResult.value;

  return {
    configLoader,
    rootDirectory,
    config,
    rsc,
  };
}
