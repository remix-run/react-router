import * as Path from "pathe";
import * as Pathe from "pathe/utils";

import type { RouteManifestEntry } from "../config/routes";
import type { ConfigLoader, ResolvedReactRouterConfig } from "../config/config";

export type Context = {
  rootDirectory: string;
  configLoader: ConfigLoader;
  config: ResolvedReactRouterConfig;
};

export function getTypesPath(ctx: Context, route: RouteManifestEntry) {
  const typegenDir = Path.join(ctx.rootDirectory, ".react-router/types");
  return Path.join(
    typegenDir,
    Path.relative(ctx.rootDirectory, ctx.config.appDirectory),
    Path.dirname(route.file),
    "+types." + Pathe.filename(route.file) + ".d.ts"
  );
}
