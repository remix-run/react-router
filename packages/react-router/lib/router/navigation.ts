import type { Navigator } from "../context";
import { ABSOLUTE_URL_REGEX } from "./url";

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

// Native links, forms, and Location headers are parsed directly by the browser.
// Classify them after the URL parser's control-character normalization, but
// require the original value to explicitly opt in to an external URL.
export function validateDocumentNavigationTarget(destination: string): void {
  let normalized = destination.replace(/[\t\n\r]/g, "");
  let start = 0;
  while (normalized.charCodeAt(start) <= 32) start++;
  normalized = normalized.slice(start);

  if (!ABSOLUTE_URL_REGEX.test(normalized)) return;

  let target: URL;
  try {
    target = new URL(destination, DEFAULT_NAVIGATION_URL);
  } catch {
    // Invalid URLs cannot cause an external navigation. Preserve the existing
    // warning behavior for malformed Link destinations.
    return;
  }
  if (!isExplicitUrl(destination, target)) {
    throw new Error("External navigation is not allowed");
  }
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
