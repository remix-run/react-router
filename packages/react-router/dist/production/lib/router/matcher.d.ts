
import { DataRouteMatch, DataRouteObject } from "./utils.js";

//#region lib/router/matcher.d.ts
interface DataRouteMatcher {
  update(routes: DataRouteObject[]): void;
  match(locationArg: Partial<Location> | string, allowPartial?: boolean): DataRouteMatch[] | null;
}
type DataRouteMatcherFactory = (basename: string) => DataRouteMatcher;
//#endregion
export { DataRouteMatcherFactory };