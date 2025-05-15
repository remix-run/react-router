import type { RouteFiles } from "react-router";
import type {
  GetLoaderData,
  GetActionData,
} from "./lib/types/internal-export/route-data";
import type { RouteModule } from "./lib/types/internal-export/route-module";
import type { Params } from "./lib/types/internal-export/params";

export type { GetAnnotations } from "./lib/types/internal-export/route-module-annotations";

export type GetInfo<T extends { file: keyof RouteFiles; module: RouteModule }> =
  {
    params: Params<T["file"]>;
    loaderData: GetLoaderData<T["module"]>;
    actionData: GetActionData<T["module"]>;
  };
