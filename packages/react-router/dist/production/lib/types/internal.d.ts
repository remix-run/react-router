
import { Normalize } from "./utils.js";
import { RouteModule } from "./route-module.js";
import { GetActionData, GetLoaderData } from "./route-data.js";
import { GetAnnotations } from "./route-module-annotations.js";
import { Register } from "react-router";

//#region lib/types/internal.d.ts
type AnyParams = Record<string, string | undefined>;
type AnyPages = Record<string, {
  params: AnyParams;
}>;
type Pages = Register extends {
  pages: infer Registered extends AnyPages;
} ? Registered : AnyPages;
type AnyRouteFiles = Record<string, {
  id: string;
  page: string;
}>;
type RouteFiles = Register extends {
  routeFiles: infer Registered extends AnyRouteFiles;
} ? Registered : AnyRouteFiles;
type Params<RouteFile extends keyof RouteFiles> = Normalize<Pages[RouteFiles[RouteFile]["page"]]["params"]>;
type GetInfo<T extends {
  file: keyof RouteFiles;
  module: RouteModule;
}> = {
  params: Params<T["file"]>;
  loaderData: GetLoaderData<T["module"]>;
  actionData: GetActionData<T["module"]>;
};
//#endregion
export { type GetAnnotations, GetInfo };