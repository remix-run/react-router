import * as React from "react";
import { RSCRouterContext, type DataRouteObject } from "../context";
import { FrameworkContext } from "../dom/ssr/components";
import type { FrameworkContextObject } from "../dom/ssr/entry";
import { createStaticRouter, StaticRouterProvider } from "../dom/server";
import { injectRSCPayload } from "./html-stream/server";
import { RSCRouterGlobalErrorBoundary } from "./errorBoundaries";
import { shouldHydrateRouteLoader } from "../dom/ssr/routes";
import type { RSCPayload } from "./server.rsc";

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
 *     const payload = await getPayload();
 *
 *     return await renderHTMLToReadableStream(
 *       <RSCStaticRouter getPayload={getPayload} />,
 *       {
 *         bootstrapScriptContent,
 *         formState: await getFormState(payload),
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
    getPayload: () => Promise<RSCPayload>,
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

  let serverResponseB: Response | null = null;
  if (hydrate) {
    serverResponseB = serverResponse.clone();
  }

  const body = serverResponse.body;
  let payloadPromise: Promise<RSCPayload>;
  const getPayload = async () => {
    if (payloadPromise) return payloadPromise;
    payloadPromise = createFromReadableStream(body) as Promise<RSCPayload>;
    return payloadPromise;
  };

  try {
    const html = await renderHTML(getPayload);

    const headers = new Headers(serverResponse.headers);
    headers.set("Content-Type", "text/html");

    if (!hydrate) {
      return new Response(html, {
        status: serverResponse.status,
        headers,
      });
    }

    if (!serverResponseB?.body) {
      throw new Error("Failed to clone server response");
    }

    const body = html.pipeThrough(injectRSCPayload(serverResponseB.body));
    return new Response(body, {
      status: serverResponse.status,
      headers,
    });
  } catch (reason) {
    if (reason instanceof Response) {
      return reason;
    }
    throw reason;
    // TODO: Track deepest rendered boundary and re-try
    // Figure out how / if we need to transport the error,
    // or if we can just re-try on the client to reach
    // the correct boundary.
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
  getPayload: () => Promise<RSCPayload>;
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
 *     const payload = await getPayload();
 *
 *     return await renderHTMLToReadableStream(
 *       <RSCStaticRouter getPayload={getPayload} />,
 *       {
 *         bootstrapScriptContent,
 *         formState: await getFormState(payload),
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
  // @ts-expect-error - need to update the React types
  const payload = React.use(getPayload()) as RSCPayload;

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
      unstable_middleware: false,
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
    routeModules: {},
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
