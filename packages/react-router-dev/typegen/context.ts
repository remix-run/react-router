import * as Path from "pathe";
import * as Pathe from "pathe/utils";

import type { RouteManifest, RouteManifestEntry } from "../config/routes";
import type * as ViteNode from "../vite/vite-node";

export type Context = {
  rootDirectory: string;
  appDirectory: string;
  routeConfigEnv: ViteNode.Context;
  routes: RouteManifest;
};

export function getTypesPath(ctx: Context, route: RouteManifestEntry) {
  const typegenDir = Path.join(ctx.rootDirectory, ".react-router/types");
  return Path.join(
    typegenDir,
    Path.relative(ctx.rootDirectory, ctx.appDirectory),
    Path.dirname(route.file),
    "+types." + Pathe.filename(route.file) + ".d.ts"
  );
}
