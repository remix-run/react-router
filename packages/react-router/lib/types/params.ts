import type { Pages, RouteFiles } from "./register";
import type { Normalize } from "./utils";

export type Params<RouteFile extends keyof RouteFiles> = Normalize<
  Pages[RouteFiles[RouteFile]["page"]]["params"]
>;
