import type { StaticHandlerContext } from "@remix-run/router";
import { splitCookiesString } from "set-cookie-parser";

import type { ServerBuild } from "./build";

export function getDocumentHeadersRR(
  build: ServerBuild,
  context: StaticHandlerContext
): Headers {
  let matches = context.errors
    ? context.matches.slice(
        0,
        context.matches.findIndex((m) => context.errors![m.route.id]) + 1
      )
    : context.matches;

  return matches.reduce((parentHeaders, match) => {
    let { id } = match.route;
    let routeModule = build.routes[id].module;
    let loaderHeaders = context.loaderHeaders[id] || new Headers();
    let actionHeaders = context.actionHeaders[id] || new Headers();
    let headers = new Headers(
      routeModule.headers
        ? typeof routeModule.headers === "function"
          ? routeModule.headers({ loaderHeaders, parentHeaders, actionHeaders })
          : routeModule.headers
        : undefined
    );

    // Automatically preserve Set-Cookie headers that were set either by the
    // loader or by a parent route.
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
