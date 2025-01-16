// eslint-disable-next-line import/no-nodejs-modules
import { AsyncLocalStorage } from "node:async_hooks";
// eslint-disable-next-line import/no-nodejs-modules
import * as stream from "node:stream";

// @ts-expect-error - no types yet
import RSD from "@jacob-ebey/react-server-dom-vite/server";
import { createElement } from "react";
// @ts-ignore - need to update types
import type { ReactFormState } from "react-dom/client";

// @ts-expect-error - no types yet
import { manifest } from "virtual:react-manifest";

import { isRedirectStatusCode, isResponse } from "./lib/router/router";
import type {
  HandleErrorFunction,
  ServerBuild,
} from "./lib/server-runtime/build";
import { derive } from "./lib/server-runtime/server";
import {
  singleFetchAction,
  singleFetchLoaders,
} from "./lib/server-runtime/single-fetch";
import type { ServerRoute } from "./lib/server-runtime/routes";
import type { ServerRouteModule } from "./lib/server-runtime/routeModules";

import { UNSAFE_ClientRouter } from "./client";

export { createStaticHandler } from "./lib/dom/server";
export { matchRoutes } from "./lib/router/utils";

/**
 * An object of unknown type for route loaders and actions provided by the
 * server's `getLoadContext()` function.  This is defined as an empty interface
 * specifically so apps can leverage declaration merging to augment this type
 * globally: https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 */
export interface ServerLoadContext {
  [key: string]: unknown;
}

export type RouteManifest = {
  id: string;
  index?: boolean;
  path?: string;
  clientModule?: string;
  hasAction?: boolean;
  hasClientAction?: boolean;
  hasClientLoader?: boolean;
  hasLoader?: boolean;
  children?: RouteManifest[];
};

export type RoutesManifest = RouteManifest[];

export type UNSAFE_ServerLocation = {
  pathname: string;
  search: string;
};

export type UNSAFE_ServerPayload = {
  formState?: ReactFormState;
  location: UNSAFE_ServerLocation;
  returnValue?: unknown;
  root: React.JSX.Element;
};

export type UNSAFE_ServerContext = {
  actionState?: Record<string, unknown>;
  body: string | FormData | ReadableStream<Uint8Array> | null | undefined;
  context: ServerLoadContext;
  destroySession?: true;
  method: string;
  redirect?: string;
  requestHeaders: Headers;
  responseHeaders: Headers;
  stage: "action" | "render" | "sent";
  status: number;
  statusText?: string;
  url: URL;
  waitToFlushUntil: Promise<unknown>[];
};

export const UNSAFE_ContextStorage =
  new AsyncLocalStorage<UNSAFE_ServerContext>();

export function renderApp(
  request: Request,
  context: ServerLoadContext,
  root: React.JSX.Element
) {
  const url = new URL(request.url);

  let _redirect: string | undefined;
  let onRedirect: ((to: string) => void) | undefined;
  const ctx: UNSAFE_ServerContext = {
    body: undefined,
    context,
    method: request.method,
    requestHeaders: request.headers,
    responseHeaders: new Headers(),
    stage: "action",
    status: 200,
    url,
    waitToFlushUntil: [],
    get redirect() {
      return _redirect;
    },
    set redirect(to: string | undefined) {
      _redirect = to;
      if (to && onRedirect) onRedirect(to);
    },
  };

  return UNSAFE_ContextStorage.run(ctx, async () => {
    let formState: ReactFormState | undefined;
    let returnValue: unknown | undefined;

    const actionId =
      request.method === "POST" ? request.headers.get("rsc-action") : null;
    try {
      if (actionId) {
        const reference = manifest.resolveServerReference(actionId);
        await reference.preload();
        const action = reference.get() as ((...args: unknown[]) => unknown) & {
          $$typeof: symbol;
        };
        if (action.$$typeof !== Symbol.for("react.server.reference")) {
          throw new Error("Invalid action");
        }

        const body = request.headers
          .get("Content-Type")
          ?.match(/^multipart\/form-data/)
          ? await request.formData()
          : await request.text();
        ctx.body = body;
        const args = await RSD.decodeReply(body, manifest);

        returnValue = action.apply(null, args);
        try {
          await returnValue;
        } catch {}
      } else if (
        request.method === "POST" &&
        request.headers.get("Content-Type")?.match(/\bmultipart\/form-data\b/)
      ) {
        const formData = await request.formData();
        ctx.body = formData;
        const action = await RSD.decodeAction(formData, manifest);
        formState = await RSD.decodeFormState(
          await action(),
          formData,
          manifest
        );
      }
    } catch (error) {
      // TODO: surface errors
      console.error(error);
    }

    if (ctx.redirect) {
      return new Response(null, {
        status: ctx.status,
        statusText: ctx.statusText,
        headers: ctx.responseHeaders,
      });
    }

    if (typeof ctx.body === "undefined") {
      ctx.body = request.body;
    }

    const payload = {
      formState,
      location: {
        pathname: url.pathname,
        search: url.search,
      },
      returnValue,
      root,
    } satisfies UNSAFE_ServerPayload;

    ctx.stage = "render";
    const { abort, pipe } = RSD.renderToPipeableStream(payload, manifest);
    request.signal.addEventListener("abort", () => abort());
    const body = stream.Readable.toWeb(
      pipe(new stream.PassThrough())
    ) as ReadableStream<Uint8Array>;

    do {
      while (ctx.waitToFlushUntil.length) {
        await ctx.waitToFlushUntil.shift();
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    } while (ctx.waitToFlushUntil.length);

    ctx.stage = "sent";
    const headers = new Headers(ctx.responseHeaders);
    if (ctx.redirect) {
      headers.set("Location", ctx.redirect);
      return new Response(null, {
        status: ctx.status,
        statusText: ctx.statusText,
        headers,
      });
    }

    let gotLateRedirect = false;
    onRedirect = () => {
      gotLateRedirect = true;
    };

    headers.set("Content-Type", "text/x-component");
    return new Response(
      body.pipeThrough(
        new TransformStream<Uint8Array, Uint8Array>({
          flush() {
            if (gotLateRedirect) {
              throw new Error("TODO: Implement late redirects");
              // controller.enqueue(
              //   new TextEncoder().encode(
              //     `\n\n${JSON.stringify({
              //       redirect: ctx.redirect,
              //     })}\n`
              //   )
              // );
            }
          },
        })
      ),
      {
        status: ctx.status,
        statusText: ctx.statusText,
        headers,
      }
    );
  });
}

function ctx() {
  const ctx = UNSAFE_ContextStorage.getStore();
  if (!ctx) {
    throw new Error("No context store found");
  }
  return ctx;
}

function ctxActionsOnly() {
  const context = ctx();
  if (context.stage !== "action") {
    throw new Error("Cannot access context in render or sent stage");
  }
  return context;
}

function ctxNotSent() {
  const context = ctx();
  if (context.stage === "sent") {
    throw new Error("Cannot access context in sent stage");
  }
  return context;
}

export function UNSAFE_getBody() {
  return ctx().body;
}

export function getMethod() {
  return ctx().method;
}

export function getActionState<T>(key: string) {
  return ctx().actionState?.[key] as T | undefined;
}

export function setActionState<T>(key: string, state: T) {
  const context = ctxActionsOnly();
  context.actionState = {
    ...context.actionState,
    [key]: state,
  };
}

export function getContext() {
  return ctx().context;
}

export function getURL() {
  return new URL(ctx().url);
}

export function getHeaders() {
  return new Headers(ctx().requestHeaders);
}

export function setHeader(key: string, value: string, append = false) {
  ctxActionsOnly().responseHeaders[append ? "append" : "set"](key, value);
}

export function setStatus(status: number, statusText?: string) {
  const context = ctxNotSent();
  if (context.redirect) {
    throw new Error("Cannot set status after redirect");
  }
  context.status = status;
  context.statusText = statusText;
}

export function redirect(to: string, status?: number): undefined {
  const context = ctx();
  if (context.stage === "sent") {
    throw new Error("TODO: Implement late redirects");
  }

  context.status =
    typeof status === "number"
      ? status
      : context.stage === "action"
      ? 303
      : 307;
  context.redirect = to;
}

export function waitToFlushUntil<T>(
  waitFor: Promise<T> | (() => Promise<T>)
): Promise<T> {
  const context = ctx();
  if (context.stage === "sent") {
    throw new Error("Response already sent");
  }

  const promise = typeof waitFor === "function" ? waitFor() : waitFor;

  context.waitToFlushUntil.push(
    Promise.resolve(promise).then(
      () => {},
      () => {}
    )
  );

  return promise;
}

export async function ServerRouter({
  build: _build,
  loadContext,
  mode,
}: {
  build: ServerBuild | (() => ServerBuild | Promise<ServerBuild>);
  loadContext?: ServerLoadContext;
  mode?: string;
}) {
  const url = getURL();
  const headers = getHeaders();
  const method = getMethod();
  const body = UNSAFE_getBody();

  const result = await waitToFlushUntil(async () => {
    const build = typeof _build === "function" ? await _build() : _build;

    const { routes, staticHandler } = derive(build, mode);

    const request = new Request(url.href, {
      body,
      headers,
      method,
    });
    const context = await staticHandler.query(request, {
      requestContext: loadContext,
    });

    if (isResponse(context)) {
      const location = context.headers.get("Location");
      if (!location || !isRedirectStatusCode(context.status)) {
        throw new Error("Invalid response");
      }
      redirect(location, context.status);
      return { redirect: true };
    }

    return {
      loaderData: context.loaderData,
      matches: context.matches,
      redirect: false,
      routes,
    };
  });

  const { loaderData, matches, routes } = result;

  if (result.redirect || !routes) {
    return;
  }

  const routesManifest: RoutesManifest = [];
  const cache = new Map<string, ServerRouteModule>();
  const setupCache = (
    _routes: ServerRoute[] = routes,
    _routesManifest: RoutesManifest = routesManifest
  ) => {
    for (const route of _routes) {
      if (!route.id) throw new Error("Route id is required");

      const manifest: RouteManifest = {
        id: route.id,
        index: route.index,
        path: route.path,
        clientModule: undefined,
        hasAction: !!route.module.action,
        hasClientAction: false,
        hasClientLoader: false,
        hasLoader: !!route.module.loader,
      };
      _routesManifest.push(manifest);

      cache.set(route.id, route.module);
      if (route.children) {
        manifest.children = [];
        setupCache(route.children, manifest.children);
      }
    }
  };
  setupCache();

  const rendered: Record<string, React.ReactNode> = {};
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];

    if (!match?.route.id) throw new Error("Route id is required");
    const route = cache.get(match.route.id);
    if (!route) throw new Error("Route not found");

    if (route.default) {
      rendered[match.route.id] = createElement(route.default);
    }
  }

  return createElement(UNSAFE_ClientRouter, {
    loaderData,
    rendered,
    routesManifest,
    url: url.href,
  });
}

export async function handleDataRequest({
  _build,
  loadContext,
  mode,
  request,
}: {
  _build: ServerBuild | (() => ServerBuild | Promise<ServerBuild>);
  handleError?: HandleErrorFunction;
  loadContext?: ServerLoadContext;
  mode?: string;
  request: Request;
}): Promise<Response | undefined> {
  const url = new URL(request.url);

  if (!url.pathname.endsWith(".data")) {
    return;
  }

  const build = typeof _build === "function" ? await _build() : _build;

  const { serverMode, staticHandler } = derive(build, mode);

  let handlerUrl = new URL(request.url);
  handlerUrl.pathname = handlerUrl.pathname
    .replace(/\.data$/, "")
    .replace(/^\/_root$/, "/");

  const { result, headers, status } =
    request.method === "GET" || request.method === "HEAD"
      ? await singleFetchLoaders(
          build,
          serverMode,
          staticHandler,
          request,
          handlerUrl,
          loadContext as any,
          (err) => {
            // TDDO: bubble up errors to build.entry.module.handleError
            console.error(err);
          }
        )
      : await singleFetchAction(
          build,
          serverMode,
          staticHandler,
          request,
          handlerUrl,
          loadContext as any,
          (err) => {
            // TDDO: bubble up errors to build.entry.module.handleError
            console.error(err);
          }
        );

  // Mark all successful responses with a header so we can identify in-flight
  // network errors that are missing this header
  let resultHeaders = new Headers(headers);
  resultHeaders.set("X-Remix-Response", "yes");

  // 304 responses should not have a body
  if (status === 304) {
    return new Response(null, { status: 304, headers: resultHeaders });
  }

  resultHeaders.set("Content-Type", "text/x-component");

  const { abort, pipe } = RSD.renderToPipeableStream(result, manifest);
  request.signal.addEventListener("abort", () => abort());
  const body = stream.Readable.toWeb(
    pipe(new stream.PassThrough())
  ) as ReadableStream<Uint8Array>;

  return new Response(body, {
    status,
    headers,
  });
}
