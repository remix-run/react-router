import type {
  ClientActionFunction,
  ClientLoaderFunction,
  LinksFunction,
  MetaFunction,
} from "./lib/dom/ssr/routeModules";
import type { Location } from "./lib/router/history";
import { createStaticHandler } from "./lib/router/router";
import {
  isRouteErrorResponse,
  type ActionFunction,
  type LoaderFunction,
  type Params,
  type ShouldRevalidateFunction,
} from "./lib/router/utils";

export { createStaticHandler } from "./lib/router/router";
export { matchRoutes } from "./lib/router/utils";

export type ServerRouteObject = { id: string; path?: string } & (
  | {
      index: true;
    }
  | {
      children?: ServerRouteObject[];
    }
) & {
    action?: ActionFunction;
    clientAction?: ClientActionFunction;
    clientLoader?: ClientLoaderFunction;
    Component?: React.ComponentType<any>;
    ErrorBoundary?: React.ComponentType<any>;
    handle?: any;
    HydrateFallback?: React.ComponentType<any>;
    Layout?: React.ComponentType<any>;
    links?: LinksFunction;
    loader?: LoaderFunction;
    meta?: MetaFunction;
    shouldRevalidate?: ShouldRevalidateFunction;
  };

export type ServerRouteMatch = {
  clientAction?: ClientActionFunction;
  clientLoader?: ClientLoaderFunction;
  Component?: React.ComponentType;
  ErrorBoundary?: React.ComponentType;
  handle?: any;
  hasAction: boolean;
  hasLoader: boolean;
  HydrateFallback?: React.ComponentType;
  id: string;
  index?: boolean;
  Layout?: React.ComponentType;
  links?: LinksFunction;
  meta?: MetaFunction;
  params: Params;
  path?: string;
  pathname: string;
  pathnameBase: string;
  shouldRevalidate?: ShouldRevalidateFunction;
};

export type ServerPayload = {
  actionData: Record<string, any> | null;
  basename?: string;
  deepestRenderedBoundaryId?: string;
  errors: Record<string, any> | null;
  loaderData: Record<string, any>;
  location: Location;
  matches: ServerRouteMatch[];
  nonce?: string;
};

export type ServerMatch = {
  statusCode: number;
  headers: Headers;
  payload: ServerPayload;
};

export async function matchServerRequest(
  request: Request,
  routes: ServerRouteObject[]
): Promise<ServerMatch | Response> {
  const handler = createStaticHandler(routes);
  const result = await handler.query(request);

  if (result instanceof Response) {
    const headers = new Headers(result.headers);
    headers.set("Vary", "Content-Type");
    headers.set("x-react-router-error", "true");
    return result;
  }

  const errors = result.errors
    ? Object.fromEntries(
        Object.entries(result.errors).map(([key, error]) => [
          key,
          isRouteErrorResponse(error)
            ? Object.fromEntries(Object.entries(error))
            : error,
        ])
      )
    : result.errors;

  const payload = {
    actionData: result.actionData,
    deepestRenderedBoundaryId: result._deepestRenderedBoundaryId ?? undefined,
    errors,
    loaderData: result.loaderData,
    location: result.location,
    matches: result.matches.map((match) => ({
      clientAction: (match.route as any).clientAction,
      clientLoader: (match.route as any).clientLoader,
      Component: (match.route as any).default,
      ErrorBoundary: (match.route as any).ErrorBoundary,
      handle: (match.route as any).handle,
      hasAction: !!match.route.action,
      hasLoader: !!match.route.loader,
      HydrateFallback: (match.route as any).HydrateFallback,
      id: match.route.id,
      index: match.route.index,
      Layout: (match.route as any).Layout,
      links: (match.route as any).links,
      meta: (match.route as any).meta,
      params: match.params,
      path: match.route.path,
      pathname: match.pathname,
      pathnameBase: match.pathnameBase,
      shouldRevalidate: (match.route as any).shouldRevalidate,
    })),
  } satisfies ServerPayload;

  return {
    statusCode: result.statusCode,
    headers: new Headers({
      "Content-Type": "text/x-component",
      Vary: "Content-Type",
    }),
    payload,
  };
}
