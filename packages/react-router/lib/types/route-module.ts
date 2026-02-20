import type { Func } from "./utils";

export type RouteModule = {
  meta?: Func | undefined;
  links?: Func | undefined;
  headers?: Func | undefined;
  loader?: Func | undefined;
  clientLoader?: Func | undefined;
  action?: Func | undefined;
  clientAction?: Func | undefined;
  HydrateFallback?: Func | undefined;
  default?: Func | undefined;
  ErrorBoundary?: Func | undefined;
  [key: string]: unknown; // allow user-defined exports
};
