export type { GetAnnotations } from "./lib/types/internal/route-module-annotations";

import type { Params } from "./lib/types/internal/params";
import type { RouteFiles } from "react-router";
import type {
  GetLoaderData,
  GetActionData,
} from "./lib/types/internal/route-data";
import type { RouteModule } from "./lib/types/internal/route-module.ts";

export type GetInfo<T extends { file: keyof RouteFiles; module: RouteModule }> =
  {
    params: Params<T["file"]>;
    loaderData: GetLoaderData<T["module"]>;
    actionData: GetActionData<T["module"]>;
  };
