import * as React from "react";

import type {
  ClientActionFunction,
  ClientLoaderFunction,
  LinksFunction,
  MetaFunction,
} from "./dom/ssr/routeModules";
import type { Location } from "./router/history";
import { createStaticHandler, isMutationMethod } from "./router/router";
import {
  type ActionFunction,
  type AgnosticDataRouteMatch,
  type AgnosticRouteObject,
  type LoaderFunction,
  type Params,
  type ShouldRevalidateFunction,
  isRouteErrorResponse,
  matchRoutes,
} from "./router/utils";

type ServerRouteObjectBase = {
  action?: ActionFunction;
  clientAction?: ClientActionFunction;
  clientLoader?: ClientLoaderFunction;
  default?: React.ComponentType<any>;
  ErrorBoundary?: React.ComponentType<any>;
  handle?: any;
  HydrateFallback?: React.ComponentType<any>;
  Layout?: React.ComponentType<any>;
  links?: LinksFunction;
  loader?: LoaderFunction;
  meta?: MetaFunction;
  shouldRevalidate?: ShouldRevalidateFunction;
};

export type ServerRouteObject = ServerRouteObjectBase & {
  id: string;
  path?: string;
  lazy?: () => Promise<ServerRouteObjectBase>;
} & (
    | {
        index: true;
      }
    | {
        children?: ServerRouteObject[];
      }
  );

export type RenderedRoute = {
  clientAction?: ClientActionFunction;
  clientLoader?: ClientLoaderFunction;
  element?: React.ReactElement | false;
  errorElement?: React.ReactElement;
  handle?: any;
  hasAction: boolean;
  hasErrorBoundary: boolean;
  hasLoader: boolean;
  hydrateFallbackElement?: React.ReactElement;
  id: string;
  index?: boolean;
  links?: LinksFunction;
  meta?: MetaFunction;
  parentId?: string;
  path?: string;
  shouldRevalidate?: ShouldRevalidateFunction;
};

export type ServerRouteMatch = RenderedRoute & {
  params: Params;
  pathname: string;
  pathnameBase: string;
};

export type ServerRenderPayload = {
  type: "render";
  actionData: Record<string, any> | null;
  basename?: string;
  errors: Record<string, any> | null;
  loaderData: Record<string, any>;
  location: Location;
  matches: ServerRouteMatch[];
  nonce?: string;
};

export type ServerManifestPayload = {
  type: "manifest";
  matches: RenderedRoute[];
};

export type ServerActionPayload = {
  type: "action";
  actionResult: Promise<unknown>;
  rerender?: Promise<ServerRenderPayload>;
};

export type ServerPayload =
  | ServerRenderPayload
  | ServerManifestPayload
  | ServerActionPayload;

export type ServerMatch = {
  statusCode: number;
  headers: Headers;
  payload: ServerPayload;
};

export type DecodeCallServerFunction = (
  id: string,
  reply: FormData | string
) => Promise<() => Promise<unknown>>;

export async function matchServerRequest({
  decodeCallServer,
  onError,
  request,
  routes,
}: {
  decodeCallServer?: DecodeCallServerFunction;
  onError?: (error: unknown) => void;
  request: Request;
  routes: ServerRouteObject[];
}): Promise<ServerMatch | Response> {
  const url = new URL(request.url);

  if (isManifestRequest(url)) {
    const matches = matchRoutes(
      routes as AgnosticRouteObject[],
      url.pathname.replace(/\.manifest$/, "")
    );
    if (!matches?.length) {
      return new Response("Not found", { status: 404 });
    }
    return {
      statusCode: 200,
      headers: new Headers({
        "Content-Type": "text/x-component",
        Vary: "Content-Type",
      }),
      payload: {
        type: "manifest",
        matches: await Promise.all(
          matches.map(async (match) => {
            let route = match.route as ServerRouteObject;
            if ("lazy" in route && route.lazy) {
              Object.assign(route, {
                ...((await route.lazy()) as any),
                path: route.path,
                index: (route as any).index,
                id: route.id,
              });
              route.lazy = undefined;
            }

            const Layout = (match.route as any).Layout || React.Fragment;
            // We send errorElement early in the manifest so we have it client
            // side for any client-side errors thrown during dataStrategy
            const errorElement = route.ErrorBoundary
              ? React.createElement(
                  Layout,
                  null,
                  React.createElement(route.ErrorBoundary)
                )
              : undefined;

            return {
              clientAction: route.clientAction,
              clientLoader: route.clientLoader,
              handle: route.handle,
              hasAction: !!route.action,
              hasErrorBoundary: !!route.ErrorBoundary,
              errorElement,
              hasLoader: !!route.loader,
              id: route.id,
              path: route.path,
              index: "index" in route ? route.index : undefined,
              links: route.links,
              meta: route.meta,
            };
          })
        ),
      } satisfies ServerManifestPayload,
    };
  }

  let statusCode = 200;
  let actionResult: Promise<unknown> | undefined;
  const actionId = request.headers.get("rsc-action-id");
  if (actionId) {
    // TODO: Handle action
    if (!decodeCallServer) {
      throw new Error(
        "Cannot handle enhanced server action without a decodeCallServer function"
      );
    }

    const reply = canDecodeWithFormData(request.headers.get("Content-Type"))
      ? await request.formData()
      : await request.text();
    const serverAction = await decodeCallServer(actionId, reply);

    actionResult = Promise.resolve(serverAction());
    try {
      // Wait for actions to finish regardless of state
      await actionResult;
    } catch (error) {
      // The error is propagated to the client through the result promise in the stream
      onError?.(error);
    }

    request = new Request(request.url, {
      method: "GET",
      headers: request.headers,
      signal: request.signal,
    });
  }

  const getRenderPayload = async (): Promise<ServerRenderPayload> => {
    const handler = createStaticHandler(routes);

    // If this is a RR submission, we just want the `actionData` but don't want
    // to call any loaders or render any components back in the response - that
    // will happen in the subsequent revalidation request
    let isSubmission = isMutationMethod(request.method);
    let searchParams = new URL(request.url).searchParams;
    let routeIdsToLoad =
      !isSubmission && searchParams.has("_routes")
        ? searchParams.get("_routes")!.split(",")
        : null;

    const staticContext = await handler.query(request, {
      skipLoaderErrorBubbling: true,
      skipRevalidation: isSubmission,
      ...(routeIdsToLoad
        ? { filterMatchesToLoad: (m) => routeIdsToLoad!.includes(m.route.id) }
        : null),
    });

    if (staticContext instanceof Response) {
      // TODO: Properly handle this case
      const headers = new Headers(staticContext.headers);
      headers.set("Vary", "Content-Type");
      headers.set("x-react-router-error", "true");
      throw staticContext;
    }

    statusCode = staticContext.statusCode ?? statusCode;

    const errors = staticContext.errors
      ? Object.fromEntries(
          Object.entries(staticContext.errors).map(([key, error]) => [
            key,
            isRouteErrorResponse(error)
              ? Object.fromEntries(Object.entries(error))
              : error,
          ])
        )
      : staticContext.errors;

    const payload: ServerRenderPayload = {
      type: "render",
      actionData: staticContext.actionData,
      errors,
      loaderData: staticContext.loaderData,
      location: staticContext.location,
      matches: [],
    };

    // Short circuit without matches on submissions
    if (isSubmission) {
      return payload;
    }

    let lastMatch: AgnosticDataRouteMatch | null = null;
    let matches = await Promise.all(
      staticContext.matches.map(async (match) => {
        if ("lazy" in match.route && match.route.lazy) {
          Object.assign(match.route, {
            // @ts-expect-error - FIXME: Fix the types here
            ...((await match.route.lazy()) as any),
            path: match.route.path,
            index: (match.route as any).index,
            id: match.route.id,
          });
          match.route.lazy = undefined;
        }

        const Layout = (match.route as any).Layout || React.Fragment;
        const Component = (match.route as any).default;
        const ErrorBoundary = (match.route as any).ErrorBoundary;
        const HydrateFallback = (match.route as any).HydrateFallback;
        // TODO: DRY this up once it's fully fleshed out
        // TODO: Align this with the fields passed in with-props.tsx
        const element = Component
          ? staticContext.errors?.[match.route.id]
            ? (false as const)
            : React.createElement(
                Layout,
                null,
                React.createElement(Component, {
                  loaderData: staticContext.loaderData[match.route.id],
                  actionData: staticContext.actionData?.[match.route.id],
                })
              )
          : undefined;
        const errorElement = ErrorBoundary
          ? React.createElement(
              Layout,
              null,
              React.createElement(ErrorBoundary)
            )
          : undefined;
        const hydrateFallbackElement = HydrateFallback
          ? React.createElement(
              Layout,
              null,
              React.createElement(HydrateFallback, {
                loaderData: staticContext.loaderData[match.route.id],
                actionData: staticContext.actionData?.[match.route.id],
              })
            )
          : match.route.id === "root"
          ? // FIXME: This should use the `RemixRootDefaultErrorBoundary` but that
            // currently uses a hook internally so it fails during RSC.  Restructure
            // so it can be used safely in an RSC render pass.
            React.createElement("p", null, "Loading!")
          : undefined;

        let result = {
          clientAction: (match.route as any).clientAction,
          clientLoader: (match.route as any).clientLoader,
          element,
          errorElement,
          handle: (match.route as any).handle,
          hasAction: !!match.route.action,
          hasErrorBoundary: !!(match.route as any).ErrorBoundary,
          hasLoader: !!match.route.loader,
          hydrateFallbackElement,
          id: match.route.id,
          index: match.route.index,
          links: (match.route as any).links,
          meta: (match.route as any).meta,
          params: match.params,
          parentId: lastMatch?.route.id,
          path: match.route.path,
          pathname: match.pathname,
          pathnameBase: match.pathnameBase,
          shouldRevalidate: (match.route as any).shouldRevalidate,
        };
        lastMatch = match;
        return result;
      })
    );

    payload.matches = routeIdsToLoad
      ? matches.filter((m) => routeIdsToLoad.includes(m.id))
      : matches;

    return payload;
  };

  try {
    return {
      statusCode,
      headers: new Headers({
        "Content-Type": "text/x-component",
        Vary: "Content-Type",
      }),
      payload: actionResult
        ? {
            type: "action",
            actionResult,
            rerender: getRenderPayload(),
          }
        : await getRenderPayload(),
    };
  } catch (error) {
    if (typeof error === "object" && error instanceof Response) {
      return error;
    }
    throw error;
  }
}

export function isReactServerRequest(url: URL) {
  return url.pathname.endsWith(".rsc");
}

export function isManifestRequest(url: URL) {
  return url.pathname.endsWith(".manifest");
}

function canDecodeWithFormData(contentType: string | null) {
  if (!contentType) return false;
  return (
    contentType.match(/\bapplication\/x-www-form-urlencoded\b/) ||
    contentType.match(/\bmultipart\/form-data\b/)
  );
}
