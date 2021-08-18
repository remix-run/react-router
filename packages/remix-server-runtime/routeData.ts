import type { AppData } from "./data";
import { extractData } from "./data";
import type { ServerRoute } from "./routes";
import type { RouteMatch } from "./routeMatching";

export interface RouteData {
  [routeId: string]: AppData;
}

export async function createRouteData(
  matches: RouteMatch<ServerRoute>[],
  responses: Response[]
): Promise<RouteData> {
  let data = await Promise.all(responses.map(extractData));

  return matches.reduce((memo, match, index) => {
    memo[match.route.id] = data[index];
    return memo;
  }, {} as RouteData);
}
