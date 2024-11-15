import type { RouteManifest } from "../config/routes";
import type * as ViteNode from "../vite/vite-node";

export type Context = {
  rootDirectory: string;
  appDirectory: string;
  routeConfigEnv: ViteNode.Context;
  routes: RouteManifest;
};
