import type { DataRouteObject, RouteBranch, DataRouteMatch } from "./utils";
import { flattenAndRankRoutes, matchRoutesImpl } from "./utils";

export interface DataRouteMatcher {
  update(routes: DataRouteObject[]): RouteBranch<DataRouteObject>[];
  match(
    locationArg: Partial<Location> | string,
    allowPartial: boolean,
  ): DataRouteMatch[] | null;
}

export class V6RegExMatcher implements DataRouteMatcher {
  #routes: DataRouteObject[] = [];
  #branches: RouteBranch<DataRouteObject>[] = [];
  #basename: string;

  constructor(basename: string) {
    this.#basename = basename;
  }

  update(routes: DataRouteObject[]): RouteBranch<DataRouteObject>[] {
    this.#routes = routes;
    this.#branches = flattenAndRankRoutes(routes);
    return this.#branches;
  }

  match(
    locationArg: Partial<Location> | string,
    allowPartial: boolean,
  ): DataRouteMatch[] | null {
    return matchRoutesImpl(
      this.#routes,
      locationArg,
      this.#basename,
      allowPartial,
      this.#branches,
    );
  }
}
