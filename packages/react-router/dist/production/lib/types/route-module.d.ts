
import { Func } from "./utils.js";

//#region lib/types/route-module.d.ts
type RouteModule = {
  meta?: Func;
  links?: Func;
  headers?: Func;
  loader?: Func;
  clientLoader?: Func;
  action?: Func;
  clientAction?: Func;
  HydrateFallback?: Func;
  default?: Func;
  ErrorBoundary?: Func;
  [key: string]: unknown;
};
//#endregion
export { RouteModule };