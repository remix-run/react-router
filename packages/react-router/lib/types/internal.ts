export type { GetAnnotations } from "./route-module-annotations";

import type { Params } from "./params";
import type { RouteFiles } from "./register";
import type { GetLoaderData, GetActionData } from "./route-data";
import type { RouteModule } from "./route-module.ts";

export type GetInfo<T extends { file: keyof RouteFiles; module: RouteModule }> =
  {
    params: Params<T["file"]>;
    loaderData: GetLoaderData<T["module"]>;
    actionData: GetActionData<T["module"]>;
  };
