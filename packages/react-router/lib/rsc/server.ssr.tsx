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
  body: ReadableStream<Uint8Array>
) => Promise<unknown>;

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
    getPayload: () => Promise<RSCPayload>
  ) => ReadableStream<Uint8Array> | Promise<ReadableStream<Uint8Array>>;
  hydrate?: boolean;
}) {
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

export function RSCStaticRouter({
  getPayload,
}: {
  getPayload: () => Promise<RSCPayload>;
}) {
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
    if (
      shouldHydrateRouteLoader(
        match.id,
        match.clientLoader,
        match.hasLoader,
        false
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
    context
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
