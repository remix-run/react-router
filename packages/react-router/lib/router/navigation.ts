import type { Navigator } from "../context";

const DEFAULT_NAVIGATION_URL = new URL("http://localhost");

export type ExternalNavigationPolicy = "allow-explicit" | "reject";

export function getNavigatorCurrentUrl(navigator: Navigator): URL {
  if (navigator.createURL) {
    return navigator.createURL("/");
  }

  try {
    return new URL(navigator.createHref("/"), DEFAULT_NAVIGATION_URL);
  } catch {
    return DEFAULT_NAVIGATION_URL;
  }
}

function isSameOrigin(a: URL, b: URL): boolean {
  return (
    a.origin === b.origin &&
    (a.origin !== "null" || (a.protocol === b.protocol && a.host === b.host))
  );
}

function isExplicitUrl(destination: string, target: URL): boolean {
  if (destination.startsWith("//")) {
    return true;
  }

  let protocol = target.protocol.toLowerCase();
  if (!destination.toLowerCase().startsWith(protocol)) {
    return false;
  }

  return (
    target.host === "" || destination.slice(protocol.length).startsWith("//")
  );
}

export function validateNavigationTarget(
  original: string | null,
  resolved: string,
  currentUrl: URL,
  externalPolicy: ExternalNavigationPolicy,
): void {
  let originalUrl: URL | null = null;
  try {
    originalUrl = original == null ? null : new URL(original, currentUrl);
  } catch {}
  let resolvedUrl = new URL(resolved, currentUrl);
  let originalIsExternal =
    originalUrl != null && !isSameOrigin(originalUrl, currentUrl);
  let resolvedIsExternal = !isSameOrigin(resolvedUrl, currentUrl);

  if (externalPolicy === "reject") {
    if (originalIsExternal || resolvedIsExternal) {
      throw new Error("External navigation is not allowed");
    }
  } else if (resolvedIsExternal) {
    if (
      originalUrl == null ||
      !isExplicitUrl(original!, originalUrl) ||
      !isSameOrigin(originalUrl, resolvedUrl)
    ) {
      throw new Error("External navigation is not allowed");
    }
  }
}
