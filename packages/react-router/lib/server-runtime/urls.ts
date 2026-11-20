import type { Path } from "../router/history";

export function getNormalizedPath(request: Request): Path {
  let url = new URL(request.url);
  let pathname = url.pathname;

  // Strip .data suffix
  if (pathname.endsWith("/_.data")) {
    // Handle trailing slash URLs: /about/_.data -> /about/
    pathname = pathname.replace(/_\.data$/, "");
  } else {
    pathname = pathname.replace(/\.data$/, "");
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
