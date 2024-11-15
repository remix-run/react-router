import type { ConfigLoader, ResolvedReactRouterConfig } from "../config/config";

export type Context = {
  rootDirectory: string;
  configLoader: ConfigLoader;
  config: ResolvedReactRouterConfig;
};
