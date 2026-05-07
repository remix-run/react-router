import type { FutureConfig } from "../dom/ssr/entry";
import type { Path } from "../router/history";
import { stripBasename } from "../router/utils";

export function getNormalizedPath(
  request: Request,
  basename: string | undefined,
  future: FutureConfig | null,
): Path {
  basename = basename || "/";

  let url = new URL(request.url);
  let pathname = url.pathname;

  // Strip .data suffix
  if (future?.unstable_trailingSlashAwareDataRequests) {
    if (pathname.endsWith("/_.data")) {
      // Handle trailing slash URLs: /about/_.data -> /about/
      pathname = pathname.replace(/_\.data$/, "");
    } else {
      pathname = pathname.replace(/\.data$/, "");
    }
  } else {
    if (stripBasename(pathname, basename) === "/_root.data") {
      pathname = basename;
    } else if (pathname.endsWith(".data")) {
      pathname = pathname.replace(/\.data$/, "");
    }

    if (stripBasename(pathname, basename) !== "/" && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
  }

  // Strip _routes param
  let searchParams = new URLSearchParams(url.search);
  searchParams.delete("_routes");
  let search = searchParams.toString();
  if (search) {
    search = `?${search}`;
  }

  // Don't touch index params here - they're needed for router matching and are
  // stripped when creating the loader/action args

  return {
    pathname,
    search,
    // No hashes on the server
    hash: "",
  };
}
