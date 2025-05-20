import { splitCookiesString } from "set-cookie-parser";

import type { DataRouteMatch } from "../context";
import type { StaticHandlerContext } from "../router/router";
import type { ServerRouteModule } from "../dom/ssr/routeModules";
import type { ServerBuild } from "./build";
import invariant from "./invariant";

// Version used by v7 framework mode
export function getDocumentHeaders(
  context: StaticHandlerContext,
  build: ServerBuild
): Headers {
  return getDocumentHeadersImpl(context, (m) => {
    let route = build.routes[m.route.id];
    invariant(route, `Route with id "${m.route.id}" not found in build`);
    return route.module.headers;
  });
}

function getDocumentHeadersImpl(
  context: StaticHandlerContext,
  getRouteHeadersFn: (match: DataRouteMatch) => ServerRouteModule["headers"]
): Headers {
  let boundaryIdx = context.errors
    ? context.matches.findIndex((m) => context.errors![m.route.id])
    : -1;
  let matches =
    boundaryIdx >= 0
      ? context.matches.slice(0, boundaryIdx + 1)
      : context.matches;

  let errorHeaders: Headers | undefined;

  if (boundaryIdx >= 0) {
    // Look for any errorHeaders from the boundary route down, which can be
    // identified by the presence of headers but no data
    let { actionHeaders, actionData, loaderHeaders, loaderData } = context;
    context.matches.slice(boundaryIdx).some((match) => {
      let id = match.route.id;
      if (
        actionHeaders[id] &&
        (!actionData || !actionData.hasOwnProperty(id))
      ) {
        errorHeaders = actionHeaders[id];
      } else if (loaderHeaders[id] && !loaderData.hasOwnProperty(id)) {
        errorHeaders = loaderHeaders[id];
      }
      return errorHeaders != null;
    });
  }

  return matches.reduce((parentHeaders, match, idx) => {
    let { id } = match.route;
    let loaderHeaders = context.loaderHeaders[id] || new Headers();
    let actionHeaders = context.actionHeaders[id] || new Headers();

    // Only expose errorHeaders to the leaf headers() function to
    // avoid duplication via parentHeaders
    let includeErrorHeaders =
      errorHeaders != null && idx === matches.length - 1;
    // Only prepend cookies from errorHeaders at the leaf renderable route
    // when it's not the same as loaderHeaders/actionHeaders to avoid
    // duplicate cookies
    let includeErrorCookies =
      includeErrorHeaders &&
      errorHeaders !== loaderHeaders &&
      errorHeaders !== actionHeaders;

    let headersFn = getRouteHeadersFn(match);

    // Use the parent headers for any route without a `headers` export
    if (headersFn == null) {
      let headers = new Headers(parentHeaders);
      if (includeErrorCookies) {
        prependCookies(errorHeaders!, headers);
      }
      prependCookies(actionHeaders, headers);
      prependCookies(loaderHeaders, headers);
      return headers;
    }

    let headers = new Headers(
      typeof headersFn === "function"
        ? headersFn({
            loaderHeaders,
            parentHeaders,
            actionHeaders,
            errorHeaders: includeErrorHeaders ? errorHeaders : undefined,
          })
        : headersFn
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
    let childCookies = new Set(childHeaders.getSetCookie());
    cookies.forEach((cookie) => {
      if (!childCookies.has(cookie)) {
        childHeaders.append("Set-Cookie", cookie);
      }
    });
  }
}
