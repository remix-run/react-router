import * as Path from "pathe";
import * as Pathe from "pathe/utils";

import type { RouteManifestEntry } from "../config/routes";
import type { Context } from "./context";

export function getTypesDir(ctx: Context) {
  return Path.join(ctx.rootDirectory, ".react-router/types");
}

export function getTypesPath(ctx: Context, route: RouteManifestEntry) {
  return Path.join(
    getTypesDir(ctx),
    Path.relative(ctx.rootDirectory, ctx.config.appDirectory),
    Path.dirname(route.file),
    "+types/" + Pathe.filename(route.file) + ".ts"
  );
}
