import type { FutureConfig } from "../dom/ssr/entry";
import { stripBasename } from "../router/utils";

export function normalizeUrl(
  url: URL,
  basename: string | undefined,
  future: FutureConfig | null,
) {
  // Strip .data suffix
  url.pathname = normalizePath(url.pathname, basename || "/", future);

  // Strip _routes param
  url.searchParams.delete("_routes");

  // Strip index param
  let indexValues = url.searchParams.getAll("index");
  url.searchParams.delete("index");
  for (let value of indexValues.filter(Boolean)) {
    url.searchParams.append("index", value);
  }

  return url;
}

export function normalizePath(
  pathname: string,
  basename: string | undefined,
  future: FutureConfig,
) {
  let normalizedBasename = basename || "/";
  let normalizedPath = pathname;
  if (future.unstable_trailingSlashAwareDataRequests) {
    if (normalizedPath.endsWith("/_.data")) {
      // Handle trailing slash URLs: /about/_.data -> /about/
      normalizedPath = normalizedPath.replace(/_.data$/, "");
    } else {
      normalizedPath = normalizedPath.replace(/\.data$/, "");
    }
  } else {
    if (stripBasename(normalizedPath, normalizedBasename) === "/_root.data") {
      normalizedPath = normalizedBasename;
    } else if (normalizedPath.endsWith(".data")) {
      normalizedPath = normalizedPath.replace(/\.data$/, "");
    }

    if (
      stripBasename(normalizedPath, normalizedBasename) !== "/" &&
      normalizedPath.endsWith("/")
    ) {
      normalizedPath = normalizedPath.slice(0, -1);
    }
  }

  return normalizedPath;
}
