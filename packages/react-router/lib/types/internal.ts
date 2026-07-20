export type { GetAnnotations } from "./route-module-annotations";

import type { Register } from "react-router";
import type { GetLoaderData, GetActionData } from "./route-data";
import type { RouteModule } from "./route-module";
import type { Normalize } from "./utils";

type AnyParams = Record<string, string | undefined>;
type AnyPages = Record<string, { params: AnyParams }>;
type Pages = Register extends {
  pages: infer Registered extends AnyPages;
}
  ? Registered
  : AnyPages;

type AnyRouteFiles = Record<string, { id: string; page: string }>;
type RouteFiles = Register extends {
  routeFiles: infer Registered extends AnyRouteFiles;
}
  ? Registered
  : AnyRouteFiles;

type Params<RouteFile extends keyof RouteFiles> = Normalize<
  Pages[RouteFiles[RouteFile]["page"]]["params"]
>;

export type GetInfo<T extends { file: keyof RouteFiles; module: RouteModule }> =
  {
    params: Params<T["file"]>;
    loaderData: GetLoaderData<T["module"]>;
    actionData: GetActionData<T["module"]>;
  };
