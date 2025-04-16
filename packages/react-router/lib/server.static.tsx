import * as React from "react";
import { type DataRouteObject } from "./context";
import { FrameworkContext } from "./dom/ssr/components";
import type { FrameworkContextObject } from "./dom/ssr/entry";
import { createStaticRouter, StaticRouterProvider } from "./dom/server";
import { injectRSCPayload } from "./html-stream/server";
import type { ServerPayload } from "./server";

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
    serverURL.pathname = serverURL.pathname.replace(/(_root)?\.rsc$/, "");
    if (!isDataRequest) {
      serverURL.searchParams.delete("_routes");
    }
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

  const payload = (await decode(serverResponse.body)) as ServerPayload;
  // TODO: Handle redirect payloads

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

export function ServerStaticRouter({ payload }: { payload: ServerPayload }) {
  if (payload.type !== "render") return null;

  const context = {
    actionData: payload.actionData,
    actionHeaders: {},
    basename: payload.basename,
    errors: payload.errors,
    loaderData: payload.loaderData,
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
      // TODO: Update these
      unstable_middleware: false,
      unstable_subResourceIntegrity: false,
    },
    isSpaMode: false,
    ssr: true,
    criticalCss: "",
    manifest: {
      routes: {
        // root: {
        //   css: []
        // },
      },
      version: "1",
      url: "",
      entry: {
        module: "",
        imports: [],
      },
    },
    routeModules: {},
  };

  return (
    <FrameworkContext.Provider value={frameworkContext}>
      <StaticRouterProvider
        context={context}
        router={router}
        hydrate={false}
        nonce={payload.nonce}
      />
    </FrameworkContext.Provider>
  );
}

export function isReactServerRequest(url: URL) {
  return url.pathname.endsWith(".rsc");
}

export function isManifestRequest(url: URL) {
  return url.pathname.endsWith(".manifest");
}
