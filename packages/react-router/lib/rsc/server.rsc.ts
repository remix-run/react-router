import * as React from "react";

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
import { getDocumentHeadersImpl } from "../server-runtime/headers";
import type { RouteMatch, RouteObject } from "../context";
import invariant from "../server-runtime/invariant";

type ServerRouteObjectBase = {
  action?: ActionFunction;
  clientAction?: ClientActionFunction;
  clientLoader?: ClientLoaderFunction;
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
  Component?: React.ComponentType<any>;
  lazy?: () => Promise<
    ServerRouteObjectBase &
      (
        | {
            default?: React.ComponentType<any>;
            Component?: never;
          }
        | {
            default?: never;
            Component?: React.ComponentType<any>;
          }
      )
  >;
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
  hasComponent: boolean;
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
  // Routes we should patch into the router for subsequent navigations.
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
  let requestUrl = new URL(request.url);

  if (isManifestRequest(requestUrl)) {
    let response = await generateManifestResponse(
      routes,
      request,
      generateResponse
    );
    return response;
  }

  let isDataRequest = isReactServerRequest(requestUrl);

  const url = new URL(request.url);
  let routerRequest = request;
  if (isDataRequest) {
    url.pathname = url.pathname.replace(/(_root)?\.rsc$/, "");
    routerRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      signal: request.signal,
      duplex: request.body ? "half" : undefined,
    } as RequestInit);
  }

  // Explode lazy functions out the routes so we can use middleware
  // TODO: This isn't ideal but we can't do it through `lazy()` in the router,
  // and if we move to `lazy: {}` then we lose all the other things from the
  // `ServerRouteObject` like `Layout` etc.
  let matches = matchRoutes(routes, url.pathname);
  if (matches) {
    await Promise.all(matches.map((m) => explodeLazyRoute(m.route)));
  }

  const leafMatch = matches?.[matches.length - 1];
  if (
    !isDataRequest &&
    leafMatch &&
    !leafMatch.route.Component &&
    !leafMatch.route.ErrorBoundary
  ) {
    return generateResourceResponse(
      routerRequest,
      routes,
      leafMatch.route.id,
      onError
    );
  }

  let response = await generateRenderResponse(
    routerRequest,
    routes,
    isDataRequest,
    decodeCallServer,
    decodeFormAction,
    onError,
    generateResponse
  );
  // The front end uses this to know whether a 404 status came from app code
  // or 404'd and never reached the origin server
  response.headers.set("X-Remix-Response", "yes");
  return response;
}

async function generateManifestResponse(
  routes: ServerRouteObject[],
  request: Request,
  generateResponse: (match: ServerMatch) => Response
) {
  let url = new URL(request.url);
  let pathnameParams = url.searchParams.getAll("p");
  let pathnames = pathnameParams.length
    ? pathnameParams
    : [url.pathname.replace(/\.manifest$/, "")];
  let routeIds = new Set<string>();
  let matchedRoutes = pathnames
    .flatMap((pathname) => {
      let pathnameMatches = matchRoutes(routes, pathname);
      return (
        pathnameMatches?.map((m, i) => ({
          ...m.route,
          parentId: pathnameMatches[i - 1]?.route.id,
        })) ?? []
      );
    })
    .filter((route) => {
      if (!routeIds.has(route.id)) {
        routeIds.add(route.id);
        return true;
      }
      return false;
    });
  let payload: ServerManifestPayload = {
    type: "manifest",
    patches: (
      await Promise.all([
        ...matchedRoutes.map((route) => getManifestRoute(route)),
        getAdditionalRoutePatches(pathnames, routes, Array.from(routeIds)),
      ])
    ).flat(1),
  };

  return generateResponse({
    statusCode: 200,
    headers: new Headers({
      "Content-Type": "text/x-component",
      Vary: "Content-Type",
    }),
    payload,
  });
}

async function processServerAction(
  request: Request,
  decodeCallServer: DecodeCallServerFunction | undefined,
  decodeFormAction: DecodeFormActionFunction | undefined,
  onError: ((error: unknown) => void) | undefined
): Promise<
  | { revalidationRequest: Request; actionResult?: Promise<unknown> }
  | Response
  | undefined
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
      if (isResponse(error)) {
        return error;
      }
      // The error is propagated to the client through the result promise in the stream
      onError?.(error);
    }
    return {
      actionResult,
      revalidationRequest: getRevalidationRequest(),
    };
  }

  const clone = request.clone();
  const formData = await request.formData();
  if (Array.from(formData.keys()).some((k) => k.startsWith("$ACTION_"))) {
    if (!decodeFormAction) {
      throw new Error(
        "Cannot handle form actions without a decodeFormAction function"
      );
    }
    const action = await decodeFormAction(formData);
    try {
      await action();
    } catch (error) {
      if (isResponse(error)) {
        return error;
      }
      onError?.(error);
    }
    return {
      revalidationRequest: getRevalidationRequest(),
    };
  }
  return {
    revalidationRequest: clone,
  };
}

async function generateResourceResponse(
  request: Request,
  routes: ServerRouteObject[],
  routeId: string,
  onError: ((error: unknown) => void) | undefined
) {
  let result: Response;
  try {
    const staticHandler = createStaticHandler(routes, {
      // TODO: Support basename
      // basename
    });

    let response = await staticHandler.queryRoute(request, {
      routeId,
      // TODO: Support loadContext
      // requestContext: loadContext,
      unstable_respond: (ctx) => ctx,
    });

    if (isResponse(response)) {
      result = response;
    } else {
      if (typeof response === "string") {
        result = new Response(response);
      } else {
        result = Response.json(response);
      }
    }
  } catch (error) {
    if (isResponse(error)) {
      result = error;
    } else {
      // TODO: Do we need to handle ErrorResponse?
      onError?.(error);

      result = new Response("Internal Server Error", {
        status: 500,
      });
    }
  }

  const headers = new Headers(result.headers);
  headers.set("React-Router-Resource", "true");
  return new Response(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers,
  });
}

async function generateRenderResponse(
  request: Request,
  routes: ServerRouteObject[],
  isDataRequest: boolean,
  decodeCallServer: DecodeCallServerFunction | undefined,
  decodeFormAction: DecodeFormActionFunction | undefined,
  onError: ((error: unknown) => void) | undefined,
  generateResponse: (match: ServerMatch) => Response
): Promise<Response> {
  // If this is a RR submission, we just want the `actionData` but don't want
  // to call any loaders or render any components back in the response - that
  // will happen in the subsequent revalidation request
  let statusCode = 200;
  let url = new URL(request.url);
  // TODO: Can this be done with a pathname extension instead of a header?
  // If not, make sure we strip this at the SSR server and it can only be set
  // by us to avoid cache-poisoning attempts

  let isSubmission = isMutationMethod(request.method);
  let routeIdsToLoad =
    !isSubmission && url.searchParams.has("_routes")
      ? url.searchParams.get("_routes")!.split(",")
      : null;

  // Create the handler here with exploded routes
  const handler = createStaticHandler(routes, {
    mapRouteProperties: (r) => ({
      hasErrorBoundary: (r as RouteObject).ErrorBoundary != null,
    }),
  });

  const result = await handler.query(request, {
    skipLoaderErrorBubbling: isDataRequest,
    skipRevalidation: isSubmission,
    ...(routeIdsToLoad
      ? { filterMatchesToLoad: (m) => routeIdsToLoad!.includes(m.route.id) }
      : null),
    async unstable_stream(_, query) {
      // If this is an RSC server action, process that and then call query as a
      // revalidation.  If this is a RR Form/Fetcher submission,
      // `processServerAction` will fall through as a no-op and we'll pass the
      // POST `request` to `query` and process our action there.
      let actionResult: Promise<unknown> | undefined;
      if (request.method === "POST") {
        let result = await processServerAction(
          request,
          decodeCallServer,
          decodeFormAction,
          onError
        );
        if (isResponse(result)) {
          return generateRedirectResponse(statusCode, result, generateResponse);
        }
        actionResult = result?.actionResult;
        request = result?.revalidationRequest ?? request;
      }

      let staticContext = await query(request);

      if (isResponse(staticContext)) {
        return generateRedirectResponse(
          statusCode,
          staticContext,
          generateResponse
        );
      }

      return generateStaticContextResponse(
        routes,
        generateResponse,
        statusCode,
        routeIdsToLoad,
        isDataRequest,
        isSubmission,
        actionResult,
        staticContext
      );
    },
  });

  if (isRedirectResponse(result)) {
    return generateRedirectResponse(statusCode, result, generateResponse);
  }

  invariant(isResponse(result), "Expected a response from query");
  return result;
}

function generateRedirectResponse(
  statusCode: number,
  response: Response,
  generateResponse: (match: ServerMatch) => Response
) {
  let payload: ServerRedirectPayload = {
    type: "redirect",
    location: response.headers.get("Location") || "",
    reload: response.headers.get("X-Remix-Reload-Document") === "true",
    replace: response.headers.get("X-Remix-Replace") === "true",
    status: response.status,
  };
  return generateResponse({
    statusCode,
    headers: new Headers({
      "Content-Type": "text/x-component",
      Vary: "Content-Type",
    }),
    payload,
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

  if (staticContext.errors) {
    staticContext.errors = Object.fromEntries(
      Object.entries(staticContext.errors).map(([key, error]) => [
        key,
        isRouteErrorResponse(error)
          ? Object.fromEntries(Object.entries(error))
          : error,
      ])
    );
  }

  // In the RSC world we set `hasLoader:true` eve if a route doesn't have a
  // loader so that we always make the single fetch call to get the rendered
  // `element`.  We add a `null` value for any of the routes that don't
  // actually have a loader so the single fetch logic can find a result for
  // the route.  This is a bit of a hack but allows us to re-use all the
  // existing logic.  This can go away if we ever fork off and re-implement a
  // standalone RSC `dataStrategy`
  staticContext.matches.forEach((m) => {
    if (staticContext.loaderData[m.route.id] === undefined) {
      staticContext.loaderData[m.route.id] = null;
    }
  });

  let headers = getDocumentHeadersImpl(
    staticContext,
    (match) => (match as RouteMatch<string, ServerRouteObject>).route.headers
  );

  const baseRenderPayload: Omit<ServerRenderPayload, "matches" | "patches"> = {
    type: "render",
    actionData: staticContext.actionData,
    errors: staticContext.errors,
    loaderData: staticContext.loaderData,
    location: staticContext.location,
  };

  const renderPayloadPromise = () =>
    getRenderPayload(
      baseRenderPayload,
      routes,
      routeIdsToLoad,
      isDataRequest,
      staticContext
    );

  let payload: ServerRenderPayload | ServerActionPayload;

  if (actionResult) {
    // Don't await the payload so we can stream down the actionResult immediately
    payload = {
      type: "action",
      actionResult,
      rerender: renderPayloadPromise(),
    };
  } else if (isSubmission && isDataRequest) {
    // Short circuit without matches on non server-action submissions since
    // we'll revalidate in a separate request
    payload = {
      ...baseRenderPayload,
      matches: [],
      patches: [],
    };
  } else {
    // Await the full RSC render on all normal requests
    payload = await renderPayloadPromise();
  }

  return generateResponse({
    statusCode,
    headers,
    payload,
  });
}

async function getRenderPayload(
  baseRenderPayload: Omit<ServerRenderPayload, "matches" | "patches">,
  routes: ServerRouteObject[],
  routeIdsToLoad: string[] | null,
  isDataRequest: boolean,
  staticContext: StaticHandlerContext
) {
  // Figure out how deep we want to render server components based on any
  // triggered error boundaries and/or `routeIdsToLoad`
  let deepestRenderedRouteIdx = staticContext.matches.length - 1;
  // Capture parentIds for assignment on the ServerRouteMatch later
  let parentIds: Record<string, string | undefined> = {};

  staticContext.matches.forEach((m, i) => {
    if (i > 0) {
      parentIds[m.route.id] = staticContext.matches[i - 1].route.id;
    }
    if (
      staticContext.errors &&
      m.route.id in staticContext.errors &&
      deepestRenderedRouteIdx > i
    ) {
      deepestRenderedRouteIdx = i;
    }
  });

  let matchesPromise = Promise.all(
    staticContext.matches.map((match, i) => {
      // Only bother rendering Server Components for routes that we're surfacing,
      // so nothing at/below an error boundary and prune routes if included in
      // `routeIdsToLoad`.  This is specifically important when a middleware
      // or loader throws and we don't have any `loaderData` to pass through as
      // props leading to render-time errors of the server component
      let shouldRenderComponent =
        i <= deepestRenderedRouteIdx &&
        (!routeIdsToLoad || routeIdsToLoad.includes(match.route.id)) &&
        (!staticContext.errors || !(match.route.id in staticContext.errors));

      return getServerRouteMatch(
        staticContext,
        match,
        shouldRenderComponent,
        parentIds[match.route.id]
      );
    })
  );

  let patchesPromise = !isDataRequest
    ? getAdditionalRoutePatches(
        [staticContext.location.pathname],
        routes,
        staticContext.matches.map((m) => m.route.id)
      )
    : undefined;

  let [matches, patches] = await Promise.all([matchesPromise, patchesPromise]);

  return {
    ...baseRenderPayload,
    matches,
    patches,
  };
}

async function getServerRouteMatch(
  staticContext: StaticHandlerContext,
  match: AgnosticDataRouteMatch,
  shouldRenderComponent: boolean,
  parentId: string | undefined
) {
  // @ts-expect-error - FIXME: Fix the types here
  await explodeLazyRoute(match.route);
  const Layout = (match.route as any).Layout || React.Fragment;
  const Component = (match.route as any).Component;
  const ErrorBoundary = (match.route as any).ErrorBoundary;
  const HydrateFallback = (match.route as any).HydrateFallback;
  const loaderData = staticContext.loaderData[match.route.id];
  const actionData = staticContext.actionData?.[match.route.id];
  const params = match.params;
  // TODO: DRY this up once it's fully fleshed out
  const element =
    Component && shouldRenderComponent
      ? React.createElement(
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
      : // TODO: Render outet instead?
        undefined;
  let error: unknown = undefined;

  // FIXME: Is this logic right?  We don't want to take any error - only the
  // error pegged to our route because the staticHandler should have done the
  // bubbling for us (on document requests at least)?
  if (ErrorBoundary && staticContext.errors) {
    for (const match of [...staticContext.matches].reverse()) {
      if (match.route.id in staticContext.errors) {
        error = staticContext.errors[match.route.id];
        break;
      }
    }
  }
  const errorElement = ErrorBoundary
    ? React.createElement(
        Layout,
        null,
        React.createElement(ErrorBoundary, {
          loaderData,
          actionData,
          params,
          error,
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

  return {
    clientAction: (match.route as any).clientAction,
    clientLoader: (match.route as any).clientLoader,
    element,
    errorElement,
    handle: (match.route as any).handle,
    hasAction: !!match.route.action,
    hasComponent: !!Component,
    hasErrorBoundary: !!ErrorBoundary,
    hasLoader: !!match.route.loader,
    hydrateFallbackElement,
    id: match.route.id,
    index: match.route.index,
    links: (match.route as any).links,
    meta: (match.route as any).meta,
    params,
    parentId,
    path: match.route.path,
    pathname: match.pathname,
    pathnameBase: match.pathnameBase,
    shouldRevalidate: (match.route as any).shouldRevalidate,
  };
}

async function getManifestRoute(
  route: ServerRouteObject & { parentId: string | undefined }
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
    hasComponent: !!route.Component,
    hasErrorBoundary: !!route.ErrorBoundary,
    errorElement,
    hasLoader: !!route.loader,
    id: route.id,
    parentId: route.parentId,
    path: route.path,
    index: "index" in route ? route.index : undefined,
    links: route.links,
    meta: route.meta,
  };
}

async function explodeLazyRoute(route: ServerRouteObject) {
  if ("lazy" in route && route.lazy) {
    let {
      default: lazyDefaultExport,
      Component: lazyComponentExport,
      ...lazyProperties
    } = (await route.lazy()) as any;
    let Component = lazyComponentExport || lazyDefaultExport;
    if (Component && !route.Component) {
      route.Component = Component;
    }
    for (let [k, v] of Object.entries(lazyProperties)) {
      if (
        k !== "id" &&
        k !== "path" &&
        k !== "index" &&
        k !== "children" &&
        route[k as keyof ServerRouteObject] == null
      ) {
        route[k as keyof ServerRouteObject] = v;
      }
    }
    route.lazy = undefined;
  }
}

async function getAdditionalRoutePatches(
  pathnames: string[],
  routes: ServerRouteObject[],
  matchedRouteIds: string[]
): Promise<RenderedRoute[]> {
  let patchRouteMatches = new Map<
    string,
    ServerRouteObject & { parentId: string | undefined }
  >();
  let matchedPaths = new Set<string>();

  for (const pathname of pathnames) {
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
      if (matchedPaths.has(path)) {
        return;
      }
      matchedPaths.add(path);
      let matches = matchRoutes(routes, path) || [];
      matches.forEach((m, i) => {
        if (patchRouteMatches.get(m.route.id)) {
          return;
        }
        patchRouteMatches.set(m.route.id, {
          ...m.route,
          parentId: matches[i - 1]?.route.id,
        });
      });
    });
  }

  let patches = await Promise.all(
    [...patchRouteMatches.values()]
      .filter((route) => !matchedRouteIds.some((id) => id === route.id))
      .map((route) => getManifestRoute(route))
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
