import type { Func } from "../utils";

export type RouteModule = {
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
  [key: string]: unknown; // allow user-defined exports
};
