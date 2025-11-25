import * as React from "react";
import { RSCRouterContext, type DataRouteObject } from "../context";
import { FrameworkContext } from "../dom/ssr/components";
import type { FrameworkContextObject } from "../dom/ssr/entry";
import { SINGLE_FETCH_REDIRECT_STATUS } from "../dom/ssr/single-fetch";
import { createStaticRouter, StaticRouterProvider } from "../dom/server";
import { injectRSCPayload } from "./html-stream/server";
import { RSCRouterGlobalErrorBoundary } from "./errorBoundaries";
import { shouldHydrateRouteLoader } from "../dom/ssr/routes";
import type { RSCPayload } from "./server.rsc";
import { createRSCRouteModules } from "./route-modules";
import { isRouteErrorResponse } from "../router/utils";
import { decodeRedirectErrorDigest } from "../errors";
import { escapeHtml } from "../dom/ssr/markup";

type DecodedPayload = Promise<RSCPayload> & {
  _deepestRenderedBoundaryId?: string | null;
  formState: Promise<any>;
};

// Safe version of React.use() that will not cause compilation errors against
// React 18 and will result in a runtime error if used (you can't use RSC against
// React 18).
const REACT_USE = "use";
const useImpl = (React as any)[REACT_USE];

function useSafe<T>(promise: Promise<T> | React.Context<T>): T {
  if (useImpl) {
    return useImpl(promise);
  }
  throw new Error("React Router v7 requires React 19+ for RSC features.");
}

export type SSRCreateFromReadableStreamFunction = (
  body: ReadableStream<Uint8Array>,
) => Promise<unknown>;

/**
 * Routes the incoming [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
 * to the [RSC](https://react.dev/reference/rsc/server-components) server and
 * appropriately proxies the server response for data / resource requests, or
 * renders to HTML for a document request.
 *
 * @example
 * import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
 * import * as ReactDomServer from "react-dom/server.edge";
 * import {
 *   unstable_RSCStaticRouter as RSCStaticRouter,
 *   unstable_routeRSCServerRequest as routeRSCServerRequest,
 * } from "react-router";
 *
 * routeRSCServerRequest({
 *   request,
 *   fetchServer,
 *   createFromReadableStream,
 *   async renderHTML(getPayload) {
 *     const payload = getPayload();
 *
 *     return await renderHTMLToReadableStream(
 *       <RSCStaticRouter getPayload={getPayload} />,
 *       {
 *         bootstrapScriptContent,
 *         formState: await payload.formState,
 *       }
 *     );
 *   },
 * });
 *
 * @name unstable_routeRSCServerRequest
 * @public
 * @category RSC
 * @mode data
 * @param opts Options
 * @param opts.createFromReadableStream Your `react-server-dom-xyz/client`'s
 * `createFromReadableStream` function, used to decode payloads from the server.
 * @param opts.fetchServer A function that forwards a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
 * to the [RSC](https://react.dev/reference/rsc/server-components) handler
 * and returns a `Promise<Response>` containing a serialized {@link unstable_RSCPayload}.
 * @param opts.hydrate Whether to hydrate the server response with the RSC payload.
 * Defaults to `true`.
 * @param opts.renderHTML A function that renders the {@link unstable_RSCPayload} to
 * HTML, usually using a {@link unstable_RSCStaticRouter | `<RSCStaticRouter>`}.
 * @param opts.request The request to route.
 * @returns A [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * that either contains the [RSC](https://react.dev/reference/rsc/server-components)
 * payload for data requests, or renders the HTML for document requests.
 */
export async function routeRSCServerRequest({
  request,
  fetchServer,
  createFromReadableStream,
  renderHTML,
  hydrate = true,
}: {
  request: Request;
  fetchServer: (request: Request) => Promise<Response>;
  createFromReadableStream: SSRCreateFromReadableStreamFunction;
  renderHTML: (
    getPayload: () => DecodedPayload,
    options: {
      onError(error: unknown): string | undefined;
      onHeaders(headers: Headers): void;
    },
  ) => ReadableStream<Uint8Array> | Promise<ReadableStream<Uint8Array>>;
  hydrate?: boolean;
}): Promise<Response> {
  const url = new URL(request.url);
  const isDataRequest = isReactServerRequest(url);
  const respondWithRSCPayload =
    isDataRequest ||
    isManifestRequest(url) ||
    request.headers.has("rsc-action-id");

  const serverResponse = await fetchServer(request);

  if (
    respondWithRSCPayload ||
    serverResponse.headers.get("React-Router-Resource") === "true"
  ) {
    return serverResponse;
  }

  if (!serverResponse.body) {
    throw new Error("Missing body in server response");
  }

  const detectRedirectResponse = serverResponse.clone();

  let serverResponseB: Response | null = null;
  if (hydrate) {
    serverResponseB = serverResponse.clone();
  }

  const body = serverResponse.body;

  let buffer: Uint8Array[] | undefined;
  let streamControllers: ReadableStreamDefaultController<Uint8Array>[] = [];

  const createStream = () => {
    if (!buffer) {
      buffer = [];
      return body.pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            buffer!.push(chunk);
            controller.enqueue(chunk);
            streamControllers.forEach((c) => c.enqueue(chunk));
          },
          flush() {
            streamControllers.forEach((c) => c.close());
            streamControllers = [];
          },
        }),
      );
    }

    return new ReadableStream({
      start(controller) {
        buffer!.forEach((chunk) => controller.enqueue(chunk));
        streamControllers.push(controller);
      },
    });
  };

  let deepestRenderedBoundaryId: string | null = null;
  const getPayload = (): DecodedPayload => {
    const payloadPromise = Promise.resolve(
      createFromReadableStream(createStream()),
    ) as Promise<RSCPayload>;

    return Object.defineProperties(payloadPromise, {
      _deepestRenderedBoundaryId: {
        get() {
          return deepestRenderedBoundaryId;
        },
        set(boundaryId: string | null) {
          deepestRenderedBoundaryId = boundaryId;
        },
      },
      formState: {
        get() {
          return payloadPromise.then((payload) =>
            payload.type === "render" ? payload.formState : undefined,
          );
        },
      },
    }) as DecodedPayload;
  };

  let renderRedirect: { status: number; location: string } | undefined;
  try {
    if (!detectRedirectResponse.body) {
      throw new Error("Failed to clone server response");
    }
    const payload = (await createFromReadableStream(
      detectRedirectResponse.body,
    )) as RSCPayload;
    if (
      serverResponse.status === SINGLE_FETCH_REDIRECT_STATUS &&
      payload.type === "redirect"
    ) {
      const headers = new Headers(serverResponse.headers);
      headers.delete("Content-Encoding");
      headers.delete("Content-Length");
      headers.delete("Content-Type");
      headers.delete("X-Remix-Response");
      headers.set("Location", payload.location);

      return new Response(serverResponseB?.body || "", {
        headers,
        status: payload.status,
        statusText: serverResponse.statusText,
      });
    }

    let reactHeaders = new Headers();
    let html = await renderHTML(getPayload, {
      onError(error: unknown) {
        if (
          typeof error === "object" &&
          error &&
          "digest" in error &&
          typeof error.digest === "string"
        ) {
          renderRedirect = decodeRedirectErrorDigest(error.digest);
          if (renderRedirect) {
            return error.digest;
          }
        }
      },
      onHeaders(headers) {
        for (const [key, value] of headers) {
          reactHeaders.append(key, value);
        }
      },
    });

    const headers = new Headers(reactHeaders);
    for (const [key, value] of serverResponse.headers) {
      headers.append(key, value);
    }
    headers.set("Content-Type", "text/html; charset=utf-8");

    if (renderRedirect) {
      headers.set("Location", renderRedirect.location);
      return new Response(html, {
        status: renderRedirect.status,
        headers,
      });
    }

    const redirectTransform = new TransformStream({
      flush(controller) {
        if (renderRedirect) {
          controller.enqueue(
            new TextEncoder().encode(
              `<meta http-equiv="refresh" content="0;url=${escapeHtml(renderRedirect.location)}"/>`,
            ),
          );
        }
      },
    });

    if (!hydrate) {
      return new Response(html.pipeThrough(redirectTransform), {
        status: serverResponse.status,
        headers,
      });
    }

    if (!serverResponseB?.body) {
      throw new Error("Failed to clone server response");
    }

    const body = html
      .pipeThrough(injectRSCPayload(serverResponseB.body))
      .pipeThrough(redirectTransform);
    return new Response(body, {
      status: serverResponse.status,
      headers,
    });
  } catch (reason) {
    if (reason instanceof Response) {
      return reason;
    }

    if (renderRedirect) {
      return new Response(`Redirect: ${renderRedirect.location}`, {
        status: renderRedirect.status,
        headers: {
          Location: renderRedirect.location,
        },
      });
    }

    try {
      const status = isRouteErrorResponse(reason) ? reason.status : 500;

      let retryRedirect: { status: number; location: string } | undefined;
      let reactHeaders = new Headers();
      const html = await renderHTML(
        () => {
          const decoded = Promise.resolve(
            createFromReadableStream(createStream()),
          ) as Promise<RSCPayload>;

          const payloadPromise = decoded.then((payload) =>
            Object.assign(payload, {
              status,
              errors: deepestRenderedBoundaryId
                ? {
                    [deepestRenderedBoundaryId]: reason,
                  }
                : {},
            }),
          );

          return Object.defineProperties(payloadPromise, {
            _deepestRenderedBoundaryId: {
              get() {
                return deepestRenderedBoundaryId;
              },
              set(boundaryId: string | null) {
                deepestRenderedBoundaryId = boundaryId;
              },
            },
            formState: {
              get() {
                return payloadPromise.then((payload) =>
                  payload.type === "render" ? payload.formState : undefined,
                );
              },
            },
          }) as unknown as DecodedPayload;
        },
        {
          onError(error: unknown) {
            if (
              typeof error === "object" &&
              error &&
              "digest" in error &&
              typeof error.digest === "string"
            ) {
              retryRedirect = decodeRedirectErrorDigest(error.digest);
              if (retryRedirect) {
                return error.digest;
              }
            }
          },
          onHeaders(headers) {
            for (const [key, value] of headers) {
              reactHeaders.append(key, value);
            }
          },
        },
      );

      const headers = new Headers(reactHeaders);
      for (const [key, value] of serverResponse.headers) {
        headers.append(key, value);
      }
      headers.set("Content-Type", "text/html; charset=utf-8");

      if (retryRedirect) {
        headers.set("Location", retryRedirect.location);
        return new Response(html, {
          status: retryRedirect.status,
          headers,
        });
      }

      const retryRedirectTransform = new TransformStream({
        flush(controller) {
          if (retryRedirect) {
            controller.enqueue(
              new TextEncoder().encode(
                `<meta http-equiv="refresh" content="0;url=${escapeHtml(retryRedirect.location)}"/>`,
              ),
            );
          }
        },
      });

      if (!hydrate) {
        return new Response(html.pipeThrough(retryRedirectTransform), {
          status: status,
          headers,
        });
      }

      if (!serverResponseB?.body) {
        throw new Error("Failed to clone server response");
      }

      const body = html
        .pipeThrough(injectRSCPayload(serverResponseB.body))
        .pipeThrough(retryRedirectTransform);
      return new Response(body, {
        status,
        headers,
      });
    } catch {
      // Throw the original error below
    }

    throw reason;
  }
}

/**
 * Props for the {@link unstable_RSCStaticRouter} component.
 *
 * @name unstable_RSCStaticRouterProps
 * @category Types
 */
export interface RSCStaticRouterProps {
  /**
   * A function that starts decoding of the {@link unstable_RSCPayload}. Usually passed
   * through from {@link unstable_routeRSCServerRequest}'s `renderHTML`.
   */
  getPayload: () => DecodedPayload;
}

/**
 * Pre-renders an {@link unstable_RSCPayload} to HTML. Usually used in
 * {@link unstable_routeRSCServerRequest}'s `renderHTML` callback.
 *
 * @example
 * import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
 * import * as ReactDomServer from "react-dom/server.edge";
 * import {
 *   unstable_RSCStaticRouter as RSCStaticRouter,
 *   unstable_routeRSCServerRequest as routeRSCServerRequest,
 * } from "react-router";
 *
 * routeRSCServerRequest({
 *   request,
 *   fetchServer,
 *   createFromReadableStream,
 *   async renderHTML(getPayload) {
 *     const payload = getPayload();
 *
 *     return await renderHTMLToReadableStream(
 *       <RSCStaticRouter getPayload={getPayload} />,
 *       {
 *         bootstrapScriptContent,
 *         formState: await payload.formState,
 *       }
 *     );
 *   },
 * });
 *
 * @name unstable_RSCStaticRouter
 * @public
 * @category RSC
 * @mode data
 * @param props Props
 * @param {unstable_RSCStaticRouterProps.getPayload} props.getPayload n/a
 * @returns A React component that renders the {@link unstable_RSCPayload} as HTML.
 */
export function RSCStaticRouter({ getPayload }: RSCStaticRouterProps) {
  const decoded = getPayload();
  // Can be replaced with React.use when v18 compatibility is no longer required.
  const payload = useSafe(decoded);

  if (payload.type === "redirect") {
    throw new Response(null, {
      status: payload.status,
      headers: {
        Location: payload.location,
      },
    });
  }

  if (payload.type !== "render") return null;

  let patchedLoaderData = { ...payload.loaderData };
  for (const match of payload.matches) {
    // Clear out the loaderData to avoid rendering the route component when the
    // route opted into clientLoader hydration and either:
    // * gave us a HydrateFallback
    // * or doesn't have a server loader and we have no data to render
    if (
      shouldHydrateRouteLoader(
        match.id,
        match.clientLoader,
        match.hasLoader,
        false,
      ) &&
      (match.hydrateFallbackElement || !match.hasLoader)
    ) {
      delete patchedLoaderData[match.id];
    }
  }

  const context = {
    get _deepestRenderedBoundaryId() {
      return decoded._deepestRenderedBoundaryId ?? null;
    },
    set _deepestRenderedBoundaryId(boundaryId: string | null) {
      decoded._deepestRenderedBoundaryId = boundaryId;
    },
    actionData: payload.actionData,
    actionHeaders: {},
    basename: payload.basename,
    errors: payload.errors,
    loaderData: patchedLoaderData,
    loaderHeaders: {},
    location: payload.location,
    statusCode: 200,
    matches: payload.matches.map((match) => ({
      params: match.params,
      pathname: match.pathname,
      pathnameBase: match.pathnameBase,
      route: {
        id: match.id,
        action: match.hasAction || !!match.clientAction,
        handle: match.handle,
        hasErrorBoundary: match.hasErrorBoundary,
        loader: match.hasLoader || !!match.clientLoader,
        index: match.index,
        path: match.path,
        shouldRevalidate: match.shouldRevalidate,
      },
    })),
  };

  const router = createStaticRouter(
    payload.matches.reduceRight((previous, match) => {
      const route: DataRouteObject = {
        id: match.id,
        action: match.hasAction || !!match.clientAction,
        element: match.element,
        errorElement: match.errorElement,
        handle: match.handle,
        hasErrorBoundary: !!match.errorElement,
        hydrateFallbackElement: match.hydrateFallbackElement,
        index: match.index,
        loader: match.hasLoader || !!match.clientLoader,
        path: match.path,
        shouldRevalidate: match.shouldRevalidate,
      };
      if (previous.length > 0) {
        route.children = previous;
      }
      return [route];
    }, [] as DataRouteObject[]),
    context,
  );

  const frameworkContext: FrameworkContextObject = {
    future: {
      // These flags have no runtime impact so can always be false.  If we add
      // flags that drive runtime behavior they'll need to be proxied through.
      v8_middleware: false,
      unstable_subResourceIntegrity: false,
    },
    isSpaMode: false,
    ssr: true,
    criticalCss: "",
    manifest: {
      routes: {},
      version: "1",
      url: "",
      entry: {
        module: "",
        imports: [],
      },
    },
    routeDiscovery: { mode: "lazy", manifestPath: "/__manifest" },
    routeModules: createRSCRouteModules(payload),
  };

  return (
    <RSCRouterContext.Provider value={true}>
      <RSCRouterGlobalErrorBoundary location={payload.location}>
        <FrameworkContext.Provider value={frameworkContext}>
          <StaticRouterProvider
            context={context}
            router={router}
            hydrate={false}
            nonce={payload.nonce}
          />
        </FrameworkContext.Provider>
      </RSCRouterGlobalErrorBoundary>
    </RSCRouterContext.Provider>
  );
}

export function isReactServerRequest(url: URL) {
  return url.pathname.endsWith(".rsc");
}

export function isManifestRequest(url: URL) {
  return url.pathname.endsWith(".manifest");
}
