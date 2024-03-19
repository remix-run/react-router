import type { StaticHandlerContext } from "@remix-run/router";
import { splitCookiesString } from "set-cookie-parser";

import type { ServerBuild } from "./build";

export function getDocumentHeaders(
  build: ServerBuild,
  context: StaticHandlerContext,
  loadRouteIds?: string[]
): Headers {
  let boundaryIdx = context.errors
    ? context.matches.findIndex((m) => context.errors![m.route.id])
    : -1;
  let matches =
    boundaryIdx >= 0
      ? context.matches.slice(0, boundaryIdx + 1)
      : context.matches;

  if (loadRouteIds) {
    matches = matches.filter((m) => loadRouteIds.includes(m.route.id));
  }

  let errorHeaders: Headers | undefined;

  if (boundaryIdx >= 0) {
    // Look for any errorHeaders from the boundary route down, which can be
    // identified by the presence of headers but no data
    let { actionHeaders, actionData, loaderHeaders, loaderData } = context;
    context.matches.slice(boundaryIdx).some((match) => {
      let id = match.route.id;
      if (actionHeaders[id] && (!actionData || actionData[id] === undefined)) {
        errorHeaders = actionHeaders[id];
      } else if (loaderHeaders[id] && loaderData[id] === undefined) {
        errorHeaders = loaderHeaders[id];
      }
      return errorHeaders != null;
    });
  }

  return matches.reduce((parentHeaders, match, idx) => {
    let { id } = match.route;
    let routeModule = build.routes[id].module;
    let loaderHeaders = context.loaderHeaders[id] || new Headers();
    let actionHeaders = context.actionHeaders[id] || new Headers();

    // Only expose errorHeaders to the leaf headers() function to
    // avoid duplication via parentHeaders
    let includeErrorHeaders =
      errorHeaders != undefined && idx === matches.length - 1;
    // Only prepend cookies from errorHeaders at the leaf renderable route
    // when it's not the same as loaderHeaders/actionHeaders to avoid
    // duplicate cookies
    let includeErrorCookies =
      includeErrorHeaders &&
      errorHeaders !== loaderHeaders &&
      errorHeaders !== actionHeaders;

    // Use the parent headers for any route without a `headers` export
    if (routeModule.headers == null) {
      let headers = new Headers(parentHeaders);
      if (includeErrorCookies) {
        prependCookies(errorHeaders!, headers);
      }
      prependCookies(actionHeaders, headers);
      prependCookies(loaderHeaders, headers);
      return headers;
    }

    let headers = new Headers(
      routeModule.headers
        ? typeof routeModule.headers === "function"
          ? routeModule.headers({
              loaderHeaders,
              parentHeaders,
              actionHeaders,
              errorHeaders: includeErrorHeaders ? errorHeaders : undefined,
            })
          : routeModule.headers
        : undefined
    );

    // Automatically preserve Set-Cookie headers from bubbled responses,
    // loaders, errors, and parent routes
    if (includeErrorCookies) {
      prependCookies(errorHeaders!, headers);
    }
    prependCookies(actionHeaders, headers);
    prependCookies(loaderHeaders, headers);
    prependCookies(parentHeaders, headers);

    return headers;
  }, new Headers());
}

function prependCookies(parentHeaders: Headers, childHeaders: Headers): void {
  let parentSetCookieString = parentHeaders.get("Set-Cookie");

  if (parentSetCookieString) {
    let cookies = splitCookiesString(parentSetCookieString);
    cookies.forEach((cookie) => {
      childHeaders.append("Set-Cookie", cookie);
    });
  }
}
