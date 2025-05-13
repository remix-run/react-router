import * as React from "react";
import * as reactRouterClient from "react-router";

import type {
  ClientActionFunction,
  ClientLoaderFunction,
  HeadersFunction,
  LinksFunction,
  MetaFunction,
} from "../dom/ssr/routeModules";
import { type Location } from "../router/history";
import {
  createStaticHandler,
  isMutationMethod,
  isResponse,
  isRedirectResponse,
  type StaticHandlerContext,
} from "../router/router";
import {
  type ActionFunction,
  type AgnosticDataRouteMatch,
  type LoaderFunction,
  type Params,
  type ShouldRevalidateFunction,
  isRouteErrorResponse,
  matchRoutes,
  convertRouteMatchToUiMatch,
} from "../router/utils";
import { getDocumentHeaders } from "../server-runtime/headers";
import type { RouteMatch } from "../context";

type ServerRouteObjectBase = {
  action?: ActionFunction;
  clientAction?: ClientActionFunction;
  clientLoader?: ClientLoaderFunction;
  default?: React.ComponentType<any>;
  ErrorBoundary?: React.ComponentType<any>;
  handle?: any;
  headers?: HeadersFunction;
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
  // Additional routes we should patch into the router for subsequent navigations.
  // Mostly a collection of pathless/index routes that may be needed for complete
  // matching on upward navigations.  Only needed on the initial document request,
  // for SPA navigations the manifest call will handle these patches.
  patches?: RenderedRoute[];
  nonce?: string;
};

export type ServerManifestPayload = {
  type: "manifest";
  // Current rendered matches
  matches: RenderedRoute[];
  // Additional routes we should patch into the router for subsequent navigations.
  // Mostly a collection of pathless/index routes that may be needed for complete
  // matching on upward navigations.
  patches: RenderedRoute[];
};

export type ServerActionPayload = {
  type: "action";
  actionResult: Promise<unknown>;
  rerender?: Promise<ServerRenderPayload | ServerRedirectPayload>;
};

export type ServerRedirectPayload = {
  type: "redirect";
  status: number;
  location: string;
  replace: boolean;
  reload: boolean;
};

export type ServerPayload =
  | ServerRenderPayload
  | ServerManifestPayload
  | ServerActionPayload
  | ServerRedirectPayload;

export type ServerMatch = {
  statusCode: number;
  headers: Headers;
  payload: ServerPayload;
};

export type DecodeCallServerFunction = (
  id: string,
  reply: FormData | string
) => Promise<() => Promise<unknown>>;

export type DecodeFormActionFunction = (
  formData: FormData
) => Promise<() => Promise<void>>;

export async function matchRSCServerRequest({
  decodeCallServer,
  decodeFormAction,
  onError,
  request,
  routes,
  generateResponse,
}: {
  decodeCallServer?: DecodeCallServerFunction;
  decodeFormAction?: DecodeFormActionFunction;
  onError?: (error: unknown) => void;
  request: Request;
  routes: ServerRouteObject[];
  generateResponse: (match: ServerMatch) => Response;
}): Promise<Response> {
  const url = new URL(request.url);

  if (isManifestRequest(url)) {
    let response = await generateManifestResponse(
      routes,
      request,
      generateResponse
    );
    return response;
  }

  let actionResult: Promise<unknown> | undefined;
  if (request.headers.get("rsc-action-id") || request.method === "POST") {
    let result = await processServerAction(
      request,
      decodeCallServer,
      decodeFormAction,
      onError
    );
    if (result) {
      // Only enhanced server actions return a result
      actionResult = result.actionResult ?? undefined;
      // Both enhanced server actions and non-enhanced $ACTION_ID_ submissions
      // return a new GET request for revalidation
      request = result.revalidationRequest ?? request;
    }
  }

  try {
    let response = await getRenderPayload(
      request,
      routes,
      generateResponse,
      actionResult
    );
    // The front end uses this to know whether a 404 status came from app code
    // or 404'd and never reached the origin server
    response.headers.set("X-Remix-Response", "yes");
    return response;
  } catch (error) {
    throw error;
  }
}

async function generateManifestResponse(
  routes: ServerRouteObject[],
  request: Request,
  generateResponse: (match: ServerMatch) => Response
) {
  let url = new URL(request.url);
  const matches = matchRoutes(routes, url.pathname.replace(/\.manifest$/, ""));

  return generateResponse({
    statusCode: 200,
    headers: new Headers({
      "Content-Type": "text/x-component",
      Vary: "Content-Type",
    }),
    payload: {
      type: "manifest",
      matches: await Promise.all(
        matches?.map((m, i) => getRoute(m.route, matches[i - 1]?.route.id)) ??
          []
      ),
      patches: await getAdditionalRoutePatches(
        url.pathname,
        routes,
        matches?.map((m) => m.route.id) ?? []
      ),
    },
  });
}

async function processServerAction(
  request: Request,
  decodeCallServer: DecodeCallServerFunction | undefined,
  decodeFormAction: DecodeFormActionFunction | undefined,
  onError: ((error: unknown) => void) | undefined
): Promise<
  { revalidationRequest: Request; actionResult?: Promise<unknown> } | undefined
> {
  const getRevalidationRequest = () =>
    new Request(request.url, {
      method: "GET",
      headers: request.headers,
      signal: request.signal,
    });

  const actionId = request.headers.get("rsc-action-id");
  if (actionId) {
    if (!decodeCallServer) {
      throw new Error(
        "Cannot handle enhanced server action without a decodeCallServer function"
      );
    }

    const reply = canDecodeWithFormData(request.headers.get("Content-Type"))
      ? await request.formData()
      : await request.text();
    const serverAction = await decodeCallServer(actionId, reply);

    let actionResult = Promise.resolve(serverAction());
    try {
      // Wait for actions to finish regardless of state
      await actionResult;
    } catch (error) {
      // The error is propagated to the client through the result promise in the stream
      onError?.(error);
    }
    return {
      actionResult,
      revalidationRequest: getRevalidationRequest(),
    };
  }

  if (request.method === "POST") {
    const formData = await request.formData();
    if (Array.from(formData.keys()).some((k) => k.startsWith("$ACTION_ID_"))) {
      if (!decodeFormAction) {
        throw new Error(
          "Cannot handle form actions without a decodeFormAction function"
        );
      }
      const action = await decodeFormAction(formData);
      try {
        await action();
      } catch (error) {
        onError?.(error);
      }
      return {
        revalidationRequest: getRevalidationRequest(),
      };
    }
  }
}

async function getRenderPayload(
  request: Request,
  routes: ServerRouteObject[],
  generateResponse: (match: ServerMatch) => Response,
  actionResult?: Promise<unknown>
): Promise<Response> {
  // If this is a RR submission, we just want the `actionData` but don't want
  // to call any loaders or render any components back in the response - that
  // will happen in the subsequent revalidation request
  let statusCode = 200;
  let url = new URL(request.url);
  // TODO: Can this be done with a pathname extension instead of a header?
  // If not, make sure we strip this at the SSR server and it can only be set
  // by us to avoid cache-poisoning attempts
  let isDataRequest = request.headers.has("X-React-Router-Data-Request");
  let isSubmission = isMutationMethod(request.method);
  let routeIdsToLoad =
    !isSubmission && url.searchParams.has("_routes")
      ? url.searchParams.get("_routes")!.split(",")
      : null;

  // Explode lazy functions out the routes so we can use middleware
  // TODO: This isn't ideal but we can't do it through `lazy()` in the router,
  // and if we move to `lazy: {}` then we lose all the other things from the
  // `ServerRouteObject` like `Layout` etc.
  let matches = matchRoutes(routes, url.pathname);
  if (matches) {
    await Promise.all(matches.map((m) => explodeLazyRoute(m.route)));
  }

  // Create the handler here with exploded routes
  const handler = createStaticHandler(routes);
  const respond = (staticContext: StaticHandlerContext) =>
    generateStaticContextResponse(
      routes,
      generateResponse,
      statusCode,
      routeIdsToLoad,
      isDataRequest,
      isSubmission,
      actionResult,
      staticContext
    );

  const result = await handler.query(request, {
    skipLoaderErrorBubbling: isDataRequest,
    skipRevalidation: isSubmission,
    ...(routeIdsToLoad
      ? { filterMatchesToLoad: (m) => routeIdsToLoad!.includes(m.route.id) }
      : null),
    unstable_respond(result) {
      if (isResponse(result)) {
        return generateRedirectResponse(statusCode, result, generateResponse);
      }
      return respond(result);
    },
  });

  if (isRedirectResponse(result)) {
    return generateRedirectResponse(statusCode, result, generateResponse);
  }

  // while middleware is still unstable, we don't run the middleware pipeline
  // if no routes have middleware, so we still might need to convert context
  // to a response here
  return isResponse(result) ? result : respond(result);
}

function generateRedirectResponse(
  statusCode: number,
  response: Response,
  generateResponse: (match: ServerMatch) => Response
) {
  return generateResponse({
    statusCode,
    headers: new Headers({
      "Content-Type": "text/x-component",
      Vary: "Content-Type",
    }),
    payload: {
      type: "redirect",
      location: response.headers.get("Location") || "",
      reload: response.headers.get("X-Remix-Reload-Document") === "true",
      replace: response.headers.get("X-Remix-Replace") === "true",
      status: response.status,
    },
  });
}

async function generateStaticContextResponse(
  routes: ServerRouteObject[],
  generateResponse: (match: ServerMatch) => Response,
  statusCode: number,
  routeIdsToLoad: string[] | null,
  isDataRequest: boolean,
  isSubmission: boolean,
  actionResult: Promise<unknown> | undefined,
  staticContext: StaticHandlerContext
): Promise<Response> {
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

  // In the RSC world we set `hasLoader:true` eve if a route doesn't have a
  // loader so that we always make the single fetch call to get the rendered
  // `element`.  We add a `null`value for any of the routes that don't
  // actually have a loader so the single fetch logic can find a result for
  // the route.  This is a bit of a hack but allows us to re-use all the
  // existing logic.  This can go away if we ever fork off and re-implement a
  // standalone RSC `dataStrategy`
  staticContext.matches.forEach((m) => {
    if (staticContext.loaderData[m.route.id] === undefined) {
      staticContext.loaderData[m.route.id] = null;
    }
  });

  let headers = getDocumentHeaders(
    staticContext,
    (match) => (match as RouteMatch<string, ServerRouteObject>).route.headers
  );

  const payload: Omit<ServerRenderPayload, "matches" | "patches"> = {
    type: "render",
    actionData: staticContext.actionData,
    errors,
    loaderData: staticContext.loaderData,
    location: staticContext.location,
  };

  // Short circuit without matches on submissions
  if (isSubmission) {
    return generateResponse({
      statusCode,
      headers,
      payload: {
        ...payload,
        matches: [],
        patches: [],
      },
    });
  }

  let lastMatch: AgnosticDataRouteMatch | null = null;
  let matchesPromise = Promise.all(
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
      const loaderData = staticContext.loaderData[match.route.id];
      const actionData = staticContext.actionData?.[match.route.id];
      const params = match.params;
      // TODO: DRY this up once it's fully fleshed out
      const element = Component
        ? staticContext.errors?.[match.route.id]
          ? (false as const)
          : React.createElement(
              Layout,
              null,
              React.createElement(Component, {
                loaderData,
                actionData,
                params,
                matches: staticContext.matches.map((match) =>
                  convertRouteMatchToUiMatch(match, staticContext.loaderData)
                ),
              })
            )
        : undefined;
      const errorElement = ErrorBoundary
        ? React.createElement(
            Layout,
            null,
            React.createElement(ErrorBoundary, {
              loaderData,
              actionData,
              params,
              error: [...staticContext.matches]
                .reverse()
                .find((match) => staticContext.errors?.[match.route.id]),
            })
          )
        : undefined;
      const hydrateFallbackElement = HydrateFallback
        ? React.createElement(
            Layout,
            null,
            React.createElement(HydrateFallback, {
              loaderData,
              actionData,
              params,
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
        params,
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

  const getPayload = async () => {
    const matches = await matchesPromise;
    return {
      ...payload,
      matches: routeIdsToLoad
        ? matches.filter((m) => routeIdsToLoad.includes(m.id))
        : matches,
      patches: !isDataRequest
        ? await getAdditionalRoutePatches(
            staticContext.location.pathname,
            routes,
            matches.map((m) => m.id)
          )
        : undefined,
    };
  };

  if (actionResult) {
    return generateResponse({
      statusCode,
      headers,
      payload: {
        type: "action",
        actionResult,
        rerender: getPayload(),
      },
    });
  } else {
    let payload = await getPayload();
    return generateResponse({
      statusCode,
      headers,
      payload,
    });
  }
}

async function getRoute(
  route: ServerRouteObject,
  parentId: string | undefined
): Promise<RenderedRoute> {
  await explodeLazyRoute(route);

  const Layout = (route as any).Layout || React.Fragment;
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
    parentId,
    path: route.path,
    index: "index" in route ? route.index : undefined,
    links: route.links,
    meta: route.meta,
  };
}

async function explodeLazyRoute(route: ServerRouteObject) {
  if ("lazy" in route && route.lazy) {
    let impl = (await route.lazy()) as any;
    for (let [k, v] of Object.entries(impl)) {
      route[k as keyof ServerRouteObject] = v;
    }
    route.lazy = undefined;
  }
}

async function getAdditionalRoutePatches(
  pathname: string,
  routes: ServerRouteObject[],
  matchedRouteIds: string[]
): Promise<RenderedRoute[]> {
  let patchRouteMatches = new Map<
    string,
    ServerRouteObject & { parentId: string | undefined }
  >();
  let segments = pathname.split("/").filter(Boolean);
  let paths: string[] = ["/"];

  // We've already matched to the last segment
  segments.pop();

  // Traverse each path for our parents and match in case they have pathless/index
  // children we need to include in the initial manifest
  while (segments.length > 0) {
    paths.push(`/${segments.join("/")}`);
    segments.pop();
  }

  paths.forEach((path) => {
    let matches = matchRoutes(routes, path) || [];
    matches.forEach((m, i) =>
      patchRouteMatches.set(m.route.id, {
        ...m.route,
        parentId: matches[i - 1]?.route.id,
      })
    );
  });

  let patches = await Promise.all(
    [...patchRouteMatches.values()]
      .filter((route) => !matchedRouteIds.some((id) => id === route.id))
      .map((route) => getRoute(route, route.parentId))
  );
  return patches;
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
