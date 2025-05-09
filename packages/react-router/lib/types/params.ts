// Import this from the react-router public API to avoid duplicates in dist/
import type { Pages, RouteFiles } from "react-router";
import type { Normalize } from "./utils";

export type Params<RouteFile extends keyof RouteFiles> = Normalize<
  Pages[RouteFiles[RouteFile]["page"]]["params"]
>;
