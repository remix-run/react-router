import * as React from "react";

import type {
  ClientActionFunction,
  ClientLoaderFunction,
  LinksFunction,
  MetaFunction,
} from "./dom/ssr/routeModules";
import { injectRSCPayload } from "./html-stream/server";
import type { Location } from "./router/history";
import { createStaticHandler } from "./router/router";
import {
  isRouteErrorResponse,
  matchRoutes,
  type ActionFunction,
  type AgnosticRouteObject,
  type LazyRouteFunction,
  type LoaderFunction,
  type Params,
  type ShouldRevalidateFunction,
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
  lazy?: LazyRouteFunction<ServerRouteObjectBase>;
} & (
    | {
        index: true;
      }
    | {
        children?: ServerRouteObject[];
      }
  );

export type ServerRouteManifest = {
  clientAction?: ClientActionFunction;
  clientLoader?: ClientLoaderFunction;
  element?: React.ReactElement;
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
  path?: string;
  shouldRevalidate?: ShouldRevalidateFunction;
};

export type ServerRouteMatch = ServerRouteManifest & {
  params: Params;
  pathname: string;
  pathnameBase: string;
};

export type ServerRenderPayload = {
  type: "render";
  actionData: Record<string, any> | null;
  basename?: string;
  deepestRenderedBoundaryId?: string;
  errors: Record<string, any> | null;
  loaderData: Record<string, any>;
  location: Location;
  matches: ServerRouteMatch[];
  nonce?: string;
  actionResult?: unknown;
};

export type ServerManifestPayload = {
  type: "manifest";
  matches: ServerRouteManifest[];
};

export type ServerPayload = ServerRenderPayload | ServerManifestPayload;

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
              route = {
                ...route,
                ...((await route.lazy()) as any),
              };
            }

            return {
              clientAction: route.clientAction,
              clientLoader: route.clientLoader,
              handle: route.handle,
              hasAction: !!route.action,
              hasErrorBoundary: !!route.ErrorBoundary,
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

  let actionResult: unknown | undefined;
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

    actionResult = serverAction();
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

  const handler = createStaticHandler(routes as AgnosticRouteObject[]);
  const staticContext = await handler.query(request);

  if (staticContext instanceof Response) {
    const headers = new Headers(staticContext.headers);
    headers.set("Vary", "Content-Type");
    headers.set("x-react-router-error", "true");
    return staticContext;
  }

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

  const payload = {
    type: "render",
    actionData: staticContext.actionData,
    actionResult,
    deepestRenderedBoundaryId:
      staticContext._deepestRenderedBoundaryId ?? undefined,
    errors,
    loaderData: staticContext.loaderData,
    location: staticContext.location,
    matches: staticContext.matches.map((match) => {
      const Layout = (match.route as any).Layout || React.Fragment;
      const Component = (match.route as any).default;
      const ErrorBoundary = (match.route as any).ErrorBoundary;
      const HydrateFallback = (match.route as any).HydrateFallback;
      const element = Component
        ? React.createElement(
            Layout,
            {
              loaderData: staticContext.loaderData[match.route.id],
              actionData: staticContext.actionData?.[match.route.id],
            },
            React.createElement(Component, {
              loaderData: staticContext.loaderData[match.route.id],
              actionData: staticContext.actionData?.[match.route.id],
            })
          )
        : undefined;
      const errorElement = ErrorBoundary
        ? React.createElement(
            Layout,
            {
              loaderData: staticContext.loaderData[match.route.id],
              actionData: staticContext.actionData?.[match.route.id],
            },
            React.createElement(ErrorBoundary)
          )
        : undefined;
      const hydrateFallbackElement = HydrateFallback
        ? React.createElement(
            Layout,
            {
              loaderData: staticContext.loaderData[match.route.id],
              actionData: staticContext.actionData?.[match.route.id],
            },
            React.createElement(HydrateFallback, {
              loaderData: staticContext.loaderData[match.route.id],
              actionData: staticContext.actionData?.[match.route.id],
            })
          )
        : undefined;

      return {
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
        path: match.route.path,
        pathname: match.pathname,
        pathnameBase: match.pathnameBase,
        shouldRevalidate: (match.route as any).shouldRevalidate,
      };
    }),
  } satisfies ServerRenderPayload;

  return {
    statusCode: staticContext.statusCode,
    headers: new Headers({
      "Content-Type": "text/x-component",
      Vary: "Content-Type",
    }),
    payload,
  };
}

export async function routeServerRequest(
  request: Request,
  requestServer: (request: Request) => Promise<Response>,
  decode: (body: ReadableStream<Uint8Array>) => Promise<ServerPayload>,
  renderHTML: (
    payload: ServerPayload
  ) => ReadableStream<Uint8Array> | Promise<ReadableStream<Uint8Array>>
) {
  const url = new URL(request.url);
  let serverRequest = request;
  const isDataRequest = isReactServerRequest(url);
  const respondWithRSCPayload =
    isDataRequest ||
    isManifestRequest(url) ||
    request.headers.has("rsc-action-id");

  if (isDataRequest) {
    const serverURL = new URL(request.url);
    serverURL.pathname = serverURL.pathname.replace(/\.rsc$/, "");
    serverRequest = new Request(serverURL, {
      body: request.body,
      duplex: request.body ? "half" : undefined,
      headers: request.headers,
      method: request.method,
      signal: request.signal,
    } as RequestInit & { duplex?: "half" });
  }

  const serverResponse = await requestServer(serverRequest);

  if (respondWithRSCPayload) {
    return serverResponse;
  }

  if (!serverResponse.body) {
    throw new Error("Missing body in server response");
  }

  const serverResponseB = serverResponse.clone();
  if (!serverResponseB.body) {
    throw new Error("Failed to clone server response");
  }

  const payload = (await decode(serverResponse.body)) as ServerRenderPayload;

  const html = await renderHTML(payload);

  try {
    const body = html.pipeThrough(injectRSCPayload(serverResponseB.body));

    const headers = new Headers(serverResponse.headers);
    headers.set("Content-Type", "text/html");

    return new Response(body, {
      status: serverResponse.status,
      headers,
    });
  } catch (reason) {
    throw reason;
    // TODO: Track deepest rendered boundary and re-try
    // Figure out how / if we need to transport the error,
    // or if we can just re-try on the client to reach
    // the correct boundary.
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
