import { resolvePath } from "../router/utils";
import { PROTOCOL_RELATIVE_URL_REGEX } from "../router/url";

export function normalizeRedirectLocation(location: string): string {
  if (PROTOCOL_RELATIVE_URL_REGEX.test(location)) {
    let path = resolvePath(location);
    return path.pathname + path.search + path.hash;
  }

  return location;
}
