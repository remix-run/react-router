export const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|[\\/]{2})/i;
export const PROTOCOL_RELATIVE_URL_REGEX = /^[\\/]{2}/;

export function normalizeProtocolRelativeUrl(url: string, protocol: string) {
  return protocol + url.replace(/\\/g, "/");
}
