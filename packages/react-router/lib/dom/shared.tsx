import * as React from "react";

import type { RouteObject } from "../context";
import type { Path, To } from "../router/history";
import { createPath, warning } from "../router/history";

// Provided by the build system
declare const __DEV__: boolean;
const ENABLE_DEV_WARNINGS = __DEV__;

export function createHref(to: To) {
  return typeof to === "string" ? to : createPath(to);
}

export function encodeLocation(to: To): Path {
  let href = typeof to === "string" ? to : createPath(to);
  // Treating this as a full URL will strip any trailing spaces so we need to
  // pre-encode them since they might be part of a matching splat param from
  // an ancestor route
  href = href.replace(/ $/, "%20");
  let encoded = ABSOLUTE_URL_REGEX.test(href)
    ? new URL(href)
    : new URL(href, "http://localhost");
  return {
    pathname: encoded.pathname,
    search: encoded.search,
    hash: encoded.hash,
  };
}

const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * @private
 */
export function mapRouteProperties(route: RouteObject) {
  let updates: Partial<RouteObject> & { hasErrorBoundary: boolean } = {
    // Note: this check also occurs in createRoutesFromChildren so update
    // there if you change this -- please and thank you!
    hasErrorBoundary:
      route.hasErrorBoundary ||
      route.ErrorBoundary != null ||
      route.errorElement != null,
  };

  if (route.Component) {
    if (ENABLE_DEV_WARNINGS) {
      if (route.element) {
        warning(
          false,
          "You should not include both `Component` and `element` on your route - " +
            "`Component` will be used."
        );
      }
    }
    Object.assign(updates, {
      element: React.createElement(route.Component),
      Component: undefined,
    });
  }

  if (route.HydrateFallback) {
    if (ENABLE_DEV_WARNINGS) {
      if (route.hydrateFallbackElement) {
        warning(
          false,
          "You should not include both `HydrateFallback` and `hydrateFallbackElement` on your route - " +
            "`HydrateFallback` will be used."
        );
      }
    }
    Object.assign(updates, {
      hydrateFallbackElement: React.createElement(route.HydrateFallback),
      HydrateFallback: undefined,
    });
  }

  if (route.ErrorBoundary) {
    if (ENABLE_DEV_WARNINGS) {
      if (route.errorElement) {
        warning(
          false,
          "You should not include both `ErrorBoundary` and `errorElement` on your route - " +
            "`ErrorBoundary` will be used."
        );
      }
    }
    Object.assign(updates, {
      errorElement: React.createElement(route.ErrorBoundary),
      ErrorBoundary: undefined,
    });
  }

  return updates;
}
