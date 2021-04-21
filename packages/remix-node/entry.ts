import jsesc from "jsesc";

import type { Response } from "./fetch";
import type { RouteMatch, ServerRouteMatch } from "./match";
import type {
  AppData,
  RouteManifest,
  RouteData,
  RouteModules,
  Route,
  ServerRouteManifest
} from "./routes";

export interface EntryContext {
  manifest: AssetsManifest;
  matches: EntryRouteMatch[];
  componentDidCatchEmulator: ComponentDidCatchEmulator;
  routeData: RouteData;
  routeModules: RouteModules;
  serverHandoffString?: string;
}

export interface AssetsManifest {
  version: string;
  url: string;
  entry: {
    module: string;
    imports: string[];
  };
  routes: EntryRouteManifest;
}

export interface EntryRoute extends Route {
  module: string;
  imports?: string[];
  hasAction?: boolean;
  hasLoader?: boolean;
}

export type EntryRouteManifest = RouteManifest<EntryRoute>;
export type EntryRouteMatch = RouteMatch<EntryRoute>;

/**
 * Because `componentDidCatch` is stateful it doesn't participate in server
 * rendering, so we emulate it with this value. Each <RemixRoute> mutates the
 * value so we know which route was the last to attempt to render. We then use
 * it to render a second time along with the caught error and emulate
 * `componentDidCatch` on the server render 🎉
 *
 * This is optional because it only exists in the server render, we don't hand
 * this off to the browser because `componentDidCatch` already works there.
 */
export interface ComponentDidCatchEmulator {
  trackBoundaries: boolean;
  // `null` means the app layout threw before any routes rendered
  renderBoundaryRouteId: string | null;
  loaderBoundaryRouteId: string | null;
  error?: SerializedError;
}

export interface SerializedError {
  message: string;
  stack?: string;
}

export function serializeError(error: Error): SerializedError {
  return {
    message: error.message,
    stack:
      error.stack &&
      error.stack.replace(
        /\((.+?)\)/g,
        (_match: string, file: string) => `(file://${file})`
      )
  };
}

export function createMatches(
  matches: ServerRouteMatch[],
  routes: EntryRouteManifest
): EntryRouteMatch[] {
  return matches.map(match => ({
    params: match.params,
    pathname: match.pathname,
    route: routes[match.route.id]
  }));
}

export async function createRouteData(
  matches: ServerRouteMatch[],
  loadResults: Response[]
): Promise<RouteData> {
  let data = await Promise.all(loadResults.map(extractData));

  return matches.reduce((memo, match, index) => {
    memo[match.route.id] = data[index];
    return memo;
  }, {} as RouteData);
}

function extractData(response: Response): Promise<AppData> {
  let contentType = response.headers.get("Content-Type");

  if (contentType && /\bapplication\/json\b/.test(contentType)) {
    return response.json();
  }

  // What other data types do we need to handle here? What other kinds of
  // responses are people going to be returning from their loaders?
  // - application/x-www-form-urlencoded ?
  // - multipart/form-data ?
  // - binary (audio/video) ?

  return response.text();
}

export function createRouteModules(
  routeManifest: ServerRouteManifest
): RouteModules {
  return Object.keys(routeManifest).reduce((memo, routeId) => {
    memo[routeId] = routeManifest[routeId].module;
    return memo;
  }, {} as RouteModules);
}

export function createServerHandoffString(serverHandoff: any): string {
  // Use jsesc to escape data returned from the loaders. This string is
  // inserted directly into the HTML in the `<Scripts>` element.
  return jsesc(serverHandoff, { isScriptContext: true });
}
