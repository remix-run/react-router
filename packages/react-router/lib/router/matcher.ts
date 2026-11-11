import type { DataRouteObject, RouteBranch, DataRouteMatch } from "./utils";
import { flattenAndRankRoutes, matchRoutesImpl } from "./utils";

export interface DataRouteMatcher {
  update(routes: DataRouteObject[]): void;
  match(
    locationArg: Partial<Location> | string,
    allowPartial?: boolean,
  ): DataRouteMatch[] | null;
}

export class V6RegExMatcher implements DataRouteMatcher {
  #routes: DataRouteObject[] = [];
  #branches: RouteBranch<DataRouteObject>[] = [];
  #basename: string;
  #matchCost = 0;

  constructor(basename: string) {
    this.#basename = basename;
  }

  update(routes: DataRouteObject[]): void {
    this.#routes = routes;
    this.#branches = flattenAndRankRoutes(routes);
    this.#matchCost = this.#branches.reduce(
      (total, branch) => total + branch.routesMeta.length,
      0,
    );
  }

  // Upper bound on route metadata visited by one match, including optional
  // segment expansion and pathless layouts within each candidate branch.
  get matchCost(): number {
    return this.#matchCost;
  }

  match(
    locationArg: Partial<Location> | string,
    allowPartial = false,
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
