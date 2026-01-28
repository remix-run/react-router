// eslint-disable-next-line import/no-nodejs-modules
import { AsyncLocalStorage } from "node:async_hooks";
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
  isDataWithResponseInit,
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
  type RouterContextProvider,
  type TrackedPromise,
  isAbsoluteUrl,
  isRouteErrorResponse,
  matchRoutes,
  prependBasename,
  convertRouteMatchToUiMatch,
  redirect as baseRedirect,
  redirectDocument as baseRedirectDocument,
  replace as baseReplace,
  stripBasename,
} from "../router/utils";
import { getDocumentHeadersImpl } from "../server-runtime/headers";
import { SINGLE_FETCH_REDIRECT_STATUS } from "../dom/ssr/single-fetch";
import { throwIfPotentialCSRFAttack } from "../actions";
import type { RouteMatch, RouteObject } from "../context";
import invariant from "../server-runtime/invariant";

import {
  Outlet as UNTYPED_Outlet,
  UNSAFE_AwaitContextProvider,
  UNSAFE_WithComponentProps,
  UNSAFE_WithHydrateFallbackProps,
  UNSAFE_WithErrorBoundaryProps,
  // @ts-ignore There are no types before the tsup build when used internally, so
  // we need to cast. If we add an alias for 'internal/react-server-client' to our
  // TSConfig, it breaks the Parcel build.
} from "react-router/internal/react-server-client";
import type {
  Await as AwaitType,
  Outlet as OutletType,
  WithComponentProps as WithComponentPropsType,
  WithErrorBoundaryProps as WithErrorBoundaryPropsType,
  WithHydrateFallbackProps as WithHydrateFallbackPropsType,
  RouteComponentProps,
  ErrorBoundaryProps,
  HydrateFallbackProps,
} from "../components";

import {
  createRedirectErrorDigest,
  createRouteErrorResponseDigest,
} from "../errors";

const Outlet: typeof OutletType = UNTYPED_Outlet;
const WithComponentProps: typeof WithComponentPropsType =
  UNSAFE_WithComponentProps;
const WithErrorBoundaryProps: typeof WithErrorBoundaryPropsType =
  UNSAFE_WithErrorBoundaryProps;
const WithHydrateFallbackProps: typeof WithHydrateFallbackPropsType =
  UNSAFE_WithHydrateFallbackProps;

type ServerContext = {
  redirect?: Response;
  runningAction: boolean;
};

const globalVar = (typeof globalThis !== "undefined" ? globalThis : global) as {
  ___reactRouterServerStorage___?: AsyncLocalStorage<ServerContext>;
};

const ServerStorage = (globalVar.___reactRouterServerStorage___ ??=
  new AsyncLocalStorage<ServerContext>());

export const redirect: typeof baseRedirect = (...args) => {
  const response = baseRedirect(...args);

  const ctx = ServerStorage.getStore();
  if (ctx && ctx.runningAction) {
    ctx.redirect = response;
  }

  return response;
};

export const redirectDocument: typeof baseRedirectDocument = (...args) => {
  const response = baseRedirectDocument(...args);

  const ctx = ServerStorage.getStore();
  if (ctx && ctx.runningAction) {
    ctx.redirect = response;
  }

  return response;
};

export const replace: typeof baseReplace = (...args) => {
  const response = baseReplace(...args);

  const ctx = ServerStorage.getStore();
  if (ctx && ctx.runningAction) {
    ctx.redirect = response;
  }

  return response;
};

const cachedResolvePromise: <T>(
  resolve: T,
) => Promise<PromiseSettledResult<Awaited<T>>> =
  // @ts-expect-error - on 18 types, requires 19.
  React.cache(async <T>(resolve: T) => {
    return Promise.allSettled([resolve]).then((r) => r[0]);
  });

export const Await: typeof AwaitType = (async ({
  children,
  resolve,
  errorElement,
}: React.ComponentProps<typeof AwaitType>) => {
  let promise = cachedResolvePromise(resolve);
  let resolved: Awaited<typeof promise> = await promise;

  if (resolved.status === "rejected" && !errorElement) {
    throw resolved.reason;
  }
  if (resolved.status === "rejected") {
    return React.createElement(UNSAFE_AwaitContextProvider, {
      children: React.createElement(React.Fragment, null, errorElement),
      value: { _tracked: true, _error: resolved.reason } as TrackedPromise,
    });
  }

  const toRender =
    typeof children === "function" ? children(resolved.value) : children;

  return React.createElement(UNSAFE_AwaitContextProvider, {
    children: toRender,
    value: { _tracked: true, _data: resolved.value } as TrackedPromise,
  });
}) as any;

type RSCRouteConfigEntryBase = {
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

export type RSCRouteConfigEntry = RSCRouteConfigEntryBase & {
  id: string;
  path?: string;
  Component?: React.ComponentType<any>;
  lazy?: () => Promise<
    RSCRouteConfigEntryBase &
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
        children?: RSCRouteConfigEntry[];
      }
  );

export type RSCRouteConfig = Array<RSCRouteConfigEntry>;

export type RSCRouteManifest = {
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

export type RSCRouteMatch = RSCRouteManifest & {
  params: Params;
  pathname: string;
  pathnameBase: string;
};

export type RSCRenderPayload = {
  type: "render";
  actionData: Record<string, any> | null;
  basename: string | undefined;
  errors: Record<string, any> | null;
  loaderData: Record<string, any>;
  location: Location;
  matches: RSCRouteMatch[];
  // Additional routes we should patch into the router for subsequent navigations.
  // Mostly a collection of pathless/index routes that may be needed for complete
  // matching on upward navigations.  Only needed on the initial document request,
  // for SPA navigations the manifest call will handle these patches.
  patches?: RSCRouteManifest[];
  nonce?: string;
  formState?: unknown;
};

export type RSCManifestPayload = {
  type: "manifest";
  // Routes we should patch into the router for subsequent navigations.
  patches: RSCRouteManifest[];
};

export type RSCActionPayload = {
  type: "action";
  actionResult: Promise<unknown>;
  rerender?: Promise<RSCRenderPayload | RSCRedirectPayload>;
};

export type RSCRedirectPayload = {
  type: "redirect";
  status: number;
  location: string;
  replace: boolean;
  reload: boolean;
  actionResult?: Promise<unknown>;
};

export type RSCPayload =
  | RSCRenderPayload
  | RSCManifestPayload
  | RSCActionPayload
  | RSCRedirectPayload;

export type RSCMatch = {
  statusCode: number;
  headers: Headers;
  payload: RSCPayload;
};

export type DecodeActionFunction = (
  formData: FormData,
) => Promise<() => Promise<unknown>>;

export type DecodeFormStateFunction = (
  result: unknown,
  formData: FormData,
) => unknown;

export type DecodeReplyFunction = (
  reply: FormData | string,
  options: { temporaryReferences: unknown },
) => Promise<unknown[]>;

export type LoadServerActionFunction = (id: string) => Promise<Function>;

/**
 * Matches the given routes to a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
 * and returns an [RSC](https://react.dev/reference/rsc/server-components)
 * [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * encoding an {@link unstable_RSCPayload} for consumption by an [RSC](https://react.dev/reference/rsc/server-components)
 * enabled client router.
 *
 * @example
 * import {
 *   createTemporaryReferenceSet,
 *   decodeAction,
 *   decodeReply,
 *   loadServerAction,
 *   renderToReadableStream,
 * } from "@vitejs/plugin-rsc/rsc";
 * import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";
 *
 * matchRSCServerRequest({
 *   createTemporaryReferenceSet,
 *   decodeAction,
 *   decodeFormState,
 *   decodeReply,
 *   loadServerAction,
 *   request,
 *   routes: routes(),
 *   generateResponse(match) {
 *     return new Response(
 *       renderToReadableStream(match.payload),
 *       {
 *         status: match.statusCode,
 *         headers: match.headers,
 *       }
 *     );
 *   },
 * });
 *
 * @name unstable_matchRSCServerRequest
 * @public
 * @category RSC
 * @mode data
 * @param opts Options
 * @param opts.allowedActionOrigins Origin patterns that are allowed to execute actions.
 * @param opts.basename The basename to use when matching the request.
 * @param opts.createTemporaryReferenceSet A function that returns a temporary
 * reference set for the request, used to track temporary references in the [RSC](https://react.dev/reference/rsc/server-components)
 * stream.
 * @param opts.decodeAction Your `react-server-dom-xyz/server`'s `decodeAction`
 * function, responsible for loading a server action.
 * @param opts.decodeFormState A function responsible for decoding form state for
 * progressively enhanceable forms with React's [`useActionState`](https://react.dev/reference/react/useActionState)
 * using your `react-server-dom-xyz/server`'s `decodeFormState`.
 * @param opts.decodeReply Your `react-server-dom-xyz/server`'s `decodeReply`
 * function, used to decode the server function's arguments and bind them to the
 * implementation for invocation by the router.
 * @param opts.generateResponse A function responsible for using your
 * `renderToReadableStream` to generate a [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * encoding the {@link unstable_RSCPayload}.
 * @param opts.loadServerAction Your `react-server-dom-xyz/server`'s
 * `loadServerAction` function, used to load a server action by ID.
 * @param opts.onError An optional error handler that will be called with any
 * errors that occur during the request processing.
 * @param opts.request The [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
 * to match against.
 * @param opts.requestContext An instance of {@link RouterContextProvider}
 * that should be created per request, to be passed to [`action`](../../start/data/route-object#action)s,
 * [`loader`](../../start/data/route-object#loader)s and [middleware](../../how-to/middleware).
 * @param opts.routes Your {@link unstable_RSCRouteConfigEntry | route definitions}.
 * @returns A [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * that contains the [RSC](https://react.dev/reference/rsc/server-components)
 * data for hydration.
 */
export async function matchRSCServerRequest({
  allowedActionOrigins,
  createTemporaryReferenceSet,
  basename,
  decodeReply,
  requestContext,
  loadServerAction,
  decodeAction,
  decodeFormState,
  onError,
  request,
  routes,
  generateResponse,
}: {
  allowedActionOrigins?: string[];
  createTemporaryReferenceSet: () => unknown;
  basename?: string;
  decodeReply?: DecodeReplyFunction;
  decodeAction?: DecodeActionFunction;
  decodeFormState?: DecodeFormStateFunction;
  requestContext?: RouterContextProvider;
  loadServerAction?: LoadServerActionFunction;
  onError?: (error: unknown) => void;
  request: Request;
  routes: RSCRouteConfigEntry[];
  generateResponse: (
    match: RSCMatch,
    {
      onError,
      temporaryReferences,
    }: {
      onError(error: unknown): string | undefined;
      temporaryReferences: unknown;
    },
  ) => Response;
}): Promise<Response> {
  let url = new URL(request.url);

  basename = basename || "/";
  let normalizedPath = url.pathname;
  if (url.pathname.endsWith("/_.rsc")) {
    normalizedPath = url.pathname.replace(/_\.rsc$/, "");
  } else if (url.pathname.endsWith(".rsc")) {
    normalizedPath = url.pathname.replace(/\.rsc$/, "");
  }

  if (
    stripBasename(normalizedPath, basename) !== "/" &&
    normalizedPath.endsWith("/")
  ) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  url.pathname = normalizedPath;
  basename =
    basename.length > normalizedPath.length ? normalizedPath : basename;

  let routerRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    signal: request.signal,
    duplex: request.body ? "half" : undefined,
  } as RequestInit);

  const temporaryReferences = createTemporaryReferenceSet();

  const requestUrl = new URL(request.url);
  if (isManifestRequest(requestUrl)) {
    let response = await generateManifestResponse(
      routes,
      basename,
      request,
      generateResponse,
      temporaryReferences,
    );
    return response;
  }

  let isDataRequest = isReactServerRequest(requestUrl);

  // Explode lazy functions out the routes so we can use middleware
  // TODO: This isn't ideal but we can't do it through `lazy()` in the router,
  // and if we move to `lazy: {}` then we lose all the other things from the
  // `RSCRouteConfigEntry` like `Layout` etc.
  let matches = matchRoutes(routes, url.pathname, basename);
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
      basename,
      leafMatch.route.id,
      requestContext,
      onError,
    );
  }

  let response = await generateRenderResponse(
    routerRequest,
    routes,
    basename,
    isDataRequest,
    decodeReply,
    requestContext,
    loadServerAction,
    decodeAction,
    decodeFormState,
    onError,
    generateResponse,
    temporaryReferences,
    allowedActionOrigins,
  );
  // The front end uses this to know whether a 4xx/5xx status came from app code
  // or never reached the origin server
  response.headers.set("X-Remix-Response", "yes");
  return response;
}

async function generateManifestResponse(
  routes: RSCRouteConfigEntry[],
  basename: string | undefined,
  request: Request,
  generateResponse: (
    match: RSCMatch,
    options: {
      onError(error: unknown): string | undefined;
      temporaryReferences: unknown;
    },
  ) => Response,
  temporaryReferences: unknown,
) {
  let url = new URL(request.url);
  let pathParam = url.searchParams.get("paths");
  let pathnames = pathParam
    ? pathParam.split(",").filter(Boolean)
    : [url.pathname.replace(/\.manifest$/, "")];
  let routeIds = new Set<string>();
  let matchedRoutes = pathnames
    .flatMap((pathname) => {
      let pathnameMatches = matchRoutes(routes, pathname, basename);
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
  let payload: RSCManifestPayload = {
    type: "manifest",
    patches: (
      await Promise.all([
        ...matchedRoutes.map((route) => getManifestRoute(route)),
        getAdditionalRoutePatches(
          pathnames,
          routes,
          basename,
          Array.from(routeIds),
        ),
      ])
    ).flat(1),
  };

  return generateResponse(
    {
      statusCode: 200,
      headers: new Headers({
        "Content-Type": "text/x-component",
        Vary: "Content-Type",
      }),
      payload,
    },
    { temporaryReferences, onError: defaultOnError },
  );
}

function prependBasenameToRedirectResponse(
  response: Response,
  basename: string | undefined = "/",
): Response {
  if (basename === "/") {
    return response;
  }

  let redirect = response.headers.get("Location");
  if (!redirect || isAbsoluteUrl(redirect)) {
    return response;
  }

  response.headers.set(
    "Location",
    prependBasename({ basename, pathname: redirect }),
  );
  return response;
}

async function processServerAction(
  request: Request,
  basename: string | undefined,
  decodeReply: DecodeReplyFunction | undefined,
  loadServerAction: LoadServerActionFunction | undefined,
  decodeAction: DecodeActionFunction | undefined,
  decodeFormState: DecodeFormStateFunction | undefined,
  onError: ((error: unknown) => void) | undefined,
  temporaryReferences: unknown,
): Promise<
  | {
      skipRevalidation: boolean;
      revalidationRequest: Request;
      actionResult?: Promise<unknown>;
      formState?: unknown;
    }
  | Response
  | undefined
> {
  const getRevalidationRequest = () =>
    new Request(request.url, {
      method: "GET",
      headers: request.headers,
      signal: request.signal,
    });

  const isFormRequest = canDecodeWithFormData(
    request.headers.get("Content-Type"),
  );
  const actionId = request.headers.get("rsc-action-id");
  if (actionId) {
    if (!decodeReply || !loadServerAction) {
      throw new Error(
        "Cannot handle enhanced server action without decodeReply and loadServerAction functions",
      );
    }

    const reply = isFormRequest
      ? await request.formData()
      : await request.text();

    const actionArgs = await decodeReply(reply, { temporaryReferences });
    const action = await loadServerAction(actionId);
    const serverAction = action.bind(null, ...actionArgs);

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

    let maybeFormData = actionArgs.length === 1 ? actionArgs[0] : actionArgs[1];
    let formData =
      maybeFormData &&
      typeof maybeFormData === "object" &&
      maybeFormData instanceof FormData
        ? maybeFormData
        : null;

    let skipRevalidation = formData?.has("$SKIP_REVALIDATION") ?? false;

    return {
      actionResult,
      revalidationRequest: getRevalidationRequest(),
      skipRevalidation,
    };
  } else if (isFormRequest) {
    const formData = await request.clone().formData();
    if (Array.from(formData.keys()).some((k) => k.startsWith("$ACTION_"))) {
      if (!decodeAction) {
        throw new Error(
          "Cannot handle form actions without a decodeAction function",
        );
      }
      const action = await decodeAction(formData);
      let formState = undefined;
      try {
        let result = await action();
        if (isRedirectResponse(result)) {
          result = prependBasenameToRedirectResponse(result, basename);
        }
        formState = decodeFormState?.(result, formData);
      } catch (error) {
        if (isRedirectResponse(error)) {
          return prependBasenameToRedirectResponse(error, basename);
        }
        if (isResponse(error)) {
          return error;
        }
        onError?.(error);
      }
      return {
        formState,
        revalidationRequest: getRevalidationRequest(),
        skipRevalidation: false,
      };
    }
  }
}

async function generateResourceResponse(
  request: Request,
  routes: RSCRouteConfigEntry[],
  basename: string | undefined,
  routeId: string,
  requestContext: RouterContextProvider | undefined,
  onError: ((error: unknown) => void) | undefined,
) {
  try {
    const staticHandler = createStaticHandler(routes, {
      basename,
    });

    let response = await staticHandler.queryRoute(request, {
      routeId,
      requestContext,
      async generateMiddlewareResponse(queryRoute) {
        try {
          let response = await queryRoute(request);
          return generateResourceResponse(response);
        } catch (error) {
          return generateErrorResponse(error);
        }
      },
    });
    return response;
  } catch (error) {
    return generateErrorResponse(error);
  }

  function generateErrorResponse(error: unknown) {
    let response: Response;
    if (isResponse(error)) {
      response = error;
    } else if (isRouteErrorResponse(error)) {
      onError?.(error);
      const errorMessage =
        typeof error.data === "string" ? error.data : error.statusText;
      response = new Response(errorMessage, {
        status: error.status,
        statusText: error.statusText,
      });
    } else {
      onError?.(error);
      response = new Response("Internal Server Error", { status: 500 });
    }

    return generateResourceResponse(response);
  }

  function generateResourceResponse(response: Response) {
    const headers = new Headers(response.headers);
    headers.set("React-Router-Resource", "true");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}

async function generateRenderResponse(
  request: Request,
  routes: RSCRouteConfigEntry[],
  basename: string | undefined,
  isDataRequest: boolean,
  decodeReply: DecodeReplyFunction | undefined,
  requestContext: RouterContextProvider | undefined,
  loadServerAction: LoadServerActionFunction | undefined,
  decodeAction: DecodeActionFunction | undefined,
  decodeFormState: DecodeFormStateFunction | undefined,
  onError: ((error: unknown) => void) | undefined,
  generateResponse: (
    match: RSCMatch,
    options: {
      onError(error: unknown): string | undefined;
      temporaryReferences: unknown;
    },
  ) => Response,
  temporaryReferences: unknown,
  allowedActionOrigins: string[] | undefined,
): Promise<Response> {
  // If this is a RR submission, we just want the `actionData` but don't want
  // to call any loaders or render any components back in the response - that
  // will happen in the subsequent revalidation request
  let statusCode = 200;
  let url = new URL(request.url);
  let isSubmission = isMutationMethod(request.method);
  let routeIdsToLoad =
    !isSubmission && url.searchParams.has("_routes")
      ? url.searchParams.get("_routes")!.split(",")
      : null;

  // Create the handler here with exploded routes
  const staticHandler = createStaticHandler(routes, {
    basename,
    mapRouteProperties: (r) => ({
      hasErrorBoundary: (r as RouteObject).ErrorBoundary != null,
    }),
  });

  let actionResult: Promise<unknown> | undefined;
  const ctx: ServerContext = {
    runningAction: false,
  };

  const result = await ServerStorage.run(ctx, () =>
    staticHandler.query(request, {
      requestContext,
      skipLoaderErrorBubbling: isDataRequest,
      skipRevalidation: isSubmission,
      ...(routeIdsToLoad
        ? { filterMatchesToLoad: (m) => routeIdsToLoad!.includes(m.route.id) }
        : {}),
      async generateMiddlewareResponse(query) {
        // If this is an RSC server action, process that and then call query as a
        // revalidation.  If this is a RR Form/Fetcher submission,
        // `processServerAction` will fall through as a no-op and we'll pass the
        // POST `request` to `query` and process our action there.
        let formState: unknown;
        let skipRevalidation = false;
        let potentialCSRFAttackError: unknown | undefined;
        if (request.method === "POST") {
          try {
            throwIfPotentialCSRFAttack(request.headers, allowedActionOrigins);

            ctx.runningAction = true;
            let result = await processServerAction(
              request,
              basename,
              decodeReply,
              loadServerAction,
              decodeAction,
              decodeFormState,
              onError,
              temporaryReferences,
            ).finally(() => {
              ctx.runningAction = false;
            });

            if (isResponse(result)) {
              return generateRedirectResponse(
                result,
                actionResult,
                basename,
                isDataRequest,
                generateResponse,
                temporaryReferences,
                (ctx.redirect as unknown as Response)?.headers,
              );
            }

            skipRevalidation = result?.skipRevalidation ?? false;
            actionResult = result?.actionResult;
            formState = result?.formState;
            request = result?.revalidationRequest ?? request;

            if (ctx.redirect) {
              return generateRedirectResponse(
                ctx.redirect,
                actionResult,
                basename,
                isDataRequest,
                generateResponse,
                temporaryReferences,
                undefined,
              );
            }
          } catch (error) {
            potentialCSRFAttackError = error;
          }
        }

        let staticContext = await query(
          request,
          skipRevalidation || !!potentialCSRFAttackError
            ? {
                filterMatchesToLoad: () => false,
              }
            : undefined,
        );

        if (isResponse(staticContext)) {
          return generateRedirectResponse(
            staticContext,
            actionResult,
            basename,
            isDataRequest,
            generateResponse,
            temporaryReferences,
            ctx.redirect?.headers,
          );
        }

        if (potentialCSRFAttackError) {
          staticContext.errors ??= {};
          staticContext.errors[staticContext.matches[0].route.id] =
            potentialCSRFAttackError;
          staticContext.statusCode = 400;
        }

        return generateStaticContextResponse(
          routes,
          basename,
          generateResponse,
          statusCode,
          routeIdsToLoad,
          isDataRequest,
          isSubmission,
          actionResult,
          formState,
          staticContext,
          temporaryReferences,
          skipRevalidation,
          ctx.redirect?.headers,
        );
      },
    }),
  );

  if (isRedirectResponse(result)) {
    return generateRedirectResponse(
      result,
      actionResult,
      basename,
      isDataRequest,
      generateResponse,
      temporaryReferences,
      ctx.redirect?.headers,
    );
  }

  invariant(isResponse(result), "Expected a response from query");
  return result;
}

function generateRedirectResponse(
  response: Response,
  actionResult: Promise<unknown> | undefined,
  basename: string | undefined,
  isDataRequest: boolean,
  generateResponse: (
    match: RSCMatch,
    options: {
      onError(error: unknown): string | undefined;
      temporaryReferences: unknown;
    },
  ) => Response,
  temporaryReferences: unknown,
  sideEffectRedirectHeaders: Headers | undefined,
) {
  let redirect = response.headers.get("Location")!;

  if (isDataRequest && basename) {
    redirect = stripBasename(redirect, basename) || redirect;
  }

  let payload: RSCRedirectPayload = {
    type: "redirect",
    location: redirect,
    reload: response.headers.get("X-Remix-Reload-Document") === "true",
    replace: response.headers.get("X-Remix-Replace") === "true",
    status: response.status,
    actionResult,
  };

  // Preserve non-internal headers on the user-created redirect and merge in
  // any side-effect redirect headers
  let headers = new Headers(sideEffectRedirectHeaders);
  for (const [key, value] of response.headers.entries()) {
    headers.append(key, value);
  }
  headers.delete("Location");
  headers.delete("X-Remix-Reload-Document");
  headers.delete("X-Remix-Replace");
  // Remove Content-Length because node:http will truncate the response body
  // to match the Content-Length header, which can result in incomplete data
  // if the actual encoded body is longer.
  // https://nodejs.org/api/http.html#class-httpclientrequest
  headers.delete("Content-Length");
  headers.set("Content-Type", "text/x-component");
  headers.set("Vary", "Content-Type");

  return generateResponse(
    {
      statusCode: SINGLE_FETCH_REDIRECT_STATUS,
      headers,
      payload,
    },
    { temporaryReferences, onError: defaultOnError },
  );
}

async function generateStaticContextResponse(
  routes: RSCRouteConfigEntry[],
  basename: string | undefined,
  generateResponse: (
    match: RSCMatch,
    options: {
      onError(error: unknown): string | undefined;
      temporaryReferences: unknown;
    },
  ) => Response,
  statusCode: number,
  routeIdsToLoad: string[] | null,
  isDataRequest: boolean,
  isSubmission: boolean,
  actionResult: Promise<unknown> | undefined,
  formState: unknown | undefined,
  staticContext: StaticHandlerContext,
  temporaryReferences: unknown,
  skipRevalidation: boolean,
  sideEffectRedirectHeaders: Headers | undefined,
): Promise<Response> {
  statusCode = staticContext.statusCode ?? statusCode;

  if (staticContext.errors) {
    staticContext.errors = Object.fromEntries(
      Object.entries(staticContext.errors).map(([key, error]) => [
        key,
        isRouteErrorResponse(error)
          ? Object.fromEntries(Object.entries(error))
          : error,
      ]),
    );
  }

  // In the RSC world we set `hasLoader:true` eve if a route doesn't have a
  // loader so that we always make the single fetch call to get the rendered
  // `element`.  We add a `null` value for any of the routes that don't
  // actually have a loader so the single fetch logic can find a result for
  // the route.  This is a bit of a hack but allows us to re-use all the
  // existing logic.  This can go away if we ever fork off and re-implement a
  // standalone RSC `dataStrategy`. We also need to ensure that we don't set
  // `loaderData` to `null` for routes that have an error, otherwise they won't
  // be forced to revalidate on navigation.
  staticContext.matches.forEach((m) => {
    const routeHasNoLoaderData =
      staticContext.loaderData[m.route.id] === undefined;
    const routeHasError = Boolean(
      staticContext.errors && m.route.id in staticContext.errors,
    );
    if (routeHasNoLoaderData && !routeHasError) {
      staticContext.loaderData[m.route.id] = null;
    }
  });

  let headers = getDocumentHeadersImpl(
    staticContext,
    (match) => (match as RouteMatch<string, RSCRouteConfigEntry>).route.headers,
    sideEffectRedirectHeaders,
  );

  // Remove Content-Length because node:http will truncate the response body
  // to match the Content-Length header, which can result in incomplete data
  // if the actual encoded body is longer.
  // https://nodejs.org/api/http.html#class-httpclientrequest
  headers.delete("Content-Length");

  const baseRenderPayload: Omit<RSCRenderPayload, "matches" | "patches"> = {
    type: "render",
    basename: staticContext.basename,
    actionData: staticContext.actionData,
    errors: staticContext.errors,
    loaderData: staticContext.loaderData,
    location: staticContext.location,
    formState,
  };

  const renderPayloadPromise = () =>
    getRenderPayload(
      baseRenderPayload,
      routes,
      basename,
      routeIdsToLoad,
      isDataRequest,
      staticContext,
    );

  let payload: RSCRenderPayload | RSCActionPayload;

  if (actionResult) {
    // Don't await the payload so we can stream down the actionResult immediately
    payload = {
      type: "action",
      actionResult,
      rerender: skipRevalidation ? undefined : renderPayloadPromise(),
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

  return generateResponse(
    {
      statusCode,
      headers,
      payload,
    },
    { temporaryReferences, onError: defaultOnError },
  );
}

async function getRenderPayload(
  baseRenderPayload: Omit<RSCRenderPayload, "matches" | "patches">,
  routes: RSCRouteConfigEntry[],
  basename: string | undefined,
  routeIdsToLoad: string[] | null,
  isDataRequest: boolean,
  staticContext: StaticHandlerContext,
) {
  // Figure out how deep we want to render server components based on any
  // triggered error boundaries and/or `routeIdsToLoad`
  let deepestRenderedRouteIdx = staticContext.matches.length - 1;
  // Capture parentIds for assignment on the RSCRouteMatch later
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
      let isBelowErrorBoundary = i > deepestRenderedRouteIdx;
      let parentId = parentIds[match.route.id];
      return getRSCRouteMatch({
        staticContext,
        match,
        routeIdsToLoad,
        isBelowErrorBoundary,
        parentId,
      });
    }),
  );

  let patchesPromise = getAdditionalRoutePatches(
    [staticContext.location.pathname],
    routes,
    basename,
    staticContext.matches.map((m) => m.route.id),
  );

  let [matches, patches] = await Promise.all([matchesPromise, patchesPromise]);

  return {
    ...baseRenderPayload,
    matches,
    patches,
  };
}

async function getRSCRouteMatch({
  staticContext,
  match,
  isBelowErrorBoundary,
  routeIdsToLoad,
  parentId,
}: {
  staticContext: StaticHandlerContext;
  match: AgnosticDataRouteMatch;
  isBelowErrorBoundary: boolean;
  routeIdsToLoad: string[] | null;
  parentId: string | undefined;
}) {
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
  let element: React.ReactElement | undefined = undefined;
  let shouldLoadRoute =
    !routeIdsToLoad || routeIdsToLoad.includes(match.route.id);
  // Only bother rendering Server Components for routes that we're surfacing,
  // so nothing at/below an error boundary and prune routes if included in
  // `routeIdsToLoad`.  This is specifically important when a middleware
  // or loader throws and we don't have any `loaderData` to pass through as
  // props leading to render-time errors of the server component
  if (Component && shouldLoadRoute) {
    element = !isBelowErrorBoundary
      ? React.createElement(
          Layout,
          null,
          isClientReference(Component)
            ? React.createElement(WithComponentProps, {
                children: React.createElement(Component),
              })
            : React.createElement(Component, {
                loaderData,
                actionData,
                params,
                matches: staticContext.matches.map((match) =>
                  convertRouteMatchToUiMatch(match, staticContext.loaderData),
                ),
              } satisfies RouteComponentProps),
        )
      : React.createElement(Outlet);
  }
  let error: unknown = undefined;

  if (ErrorBoundary && staticContext.errors) {
    error = staticContext.errors[match.route.id];
  }
  const errorElement = ErrorBoundary
    ? React.createElement(
        Layout,
        null,
        isClientReference(ErrorBoundary)
          ? React.createElement(WithErrorBoundaryProps, {
              children: React.createElement(ErrorBoundary),
            })
          : React.createElement(ErrorBoundary, {
              loaderData,
              actionData,
              params,
              error,
            } satisfies ErrorBoundaryProps),
      )
    : undefined;
  const hydrateFallbackElement = HydrateFallback
    ? React.createElement(
        Layout,
        null,
        isClientReference(HydrateFallback)
          ? React.createElement(WithHydrateFallbackProps, {
              children: React.createElement(HydrateFallback),
            })
          : React.createElement(HydrateFallback, {
              loaderData,
              actionData,
              params,
            } satisfies HydrateFallbackProps),
      )
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
    // Add an unused client-only export (if present) so HMR can support
    // switching between server-first and client-only routes during development
    ...((match.route as any).__ensureClientRouteModuleForHMR
      ? {
          __ensureClientRouteModuleForHMR: (match.route as any)
            .__ensureClientRouteModuleForHMR,
        }
      : {}),
  };
}

async function getManifestRoute(
  route: RSCRouteConfigEntry & { parentId: string | undefined },
): Promise<RSCRouteManifest> {
  await explodeLazyRoute(route);

  const Layout = (route as any).Layout || React.Fragment;
  // We send errorElement early in the manifest so we have it client
  // side for any client-side errors thrown during dataStrategy
  const errorElement = route.ErrorBoundary
    ? React.createElement(
        Layout,
        null,
        React.createElement(route.ErrorBoundary),
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

async function explodeLazyRoute(route: RSCRouteConfigEntry) {
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
        route[k as keyof RSCRouteConfigEntry] == null
      ) {
        route[k as keyof RSCRouteConfigEntry] = v;
      }
    }
    route.lazy = undefined;
  }
}

async function getAdditionalRoutePatches(
  pathnames: string[],
  routes: RSCRouteConfigEntry[],
  basename: string | undefined,
  matchedRouteIds: string[],
): Promise<RSCRouteManifest[]> {
  let patchRouteMatches = new Map<
    string,
    RSCRouteConfigEntry & { parentId: string | undefined }
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
      let matches = matchRoutes(routes, path, basename) || [];
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
      .map((route) => getManifestRoute(route)),
  );
  return patches;
}

export function isReactServerRequest(url: URL) {
  return url.pathname.endsWith(".rsc");
}

export function isManifestRequest(url: URL) {
  return url.pathname.endsWith(".manifest");
}

function defaultOnError(error: unknown) {
  if (isRedirectResponse(error)) {
    return createRedirectErrorDigest(error);
  }
  if (isResponse(error) || isDataWithResponseInit(error)) {
    return createRouteErrorResponseDigest(error);
  }
}

function isClientReference(x: any) {
  try {
    return x.$$typeof === Symbol.for("react.client.reference");
  } catch {
    return false;
  }
}

function canDecodeWithFormData(contentType: string | null) {
  if (!contentType) return false;
  return (
    contentType.match(/\bapplication\/x-www-form-urlencoded\b/) ||
    contentType.match(/\bmultipart\/form-data\b/)
  );
}
