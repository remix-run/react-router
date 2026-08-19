export const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|[\\/]{2})/i;
export const PROTOCOL_RELATIVE_URL_REGEX = /^[\\/]{2}/;

// Normalize characters ignored by the URL parser before determining whether a
// URL is relative or absolute.
export function normalizeRelativeUrl(url: string): string {
  if (ABSOLUTE_URL_REGEX.test(url)) {
    return url;
  }

  let normalized = url.replace(/[\t\n\r]/g, "");
  if (!ABSOLUTE_URL_REGEX.test(normalized)) {
    return normalized;
  }

  if (PROTOCOL_RELATIVE_URL_REGEX.test(normalized)) {
    return normalized.replace(/^[\\/]+/, "/");
  }

  return normalized.replace(/^([a-z][a-z0-9+.-]*):/i, "$1%3A");
}

export function normalizeProtocolRelativeUrl(url: string, protocol: string) {
  return protocol + url.replace(/\\/g, "/");
}
