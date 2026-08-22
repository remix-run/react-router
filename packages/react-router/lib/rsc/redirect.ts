import { resolvePath } from "../router/utils";
import {
  normalizeRelativeUrl,
  PROTOCOL_RELATIVE_URL_REGEX,
} from "../router/url";

export function normalizeRedirectLocation(location: string): string {
  location = normalizeRelativeUrl(location);

  if (PROTOCOL_RELATIVE_URL_REGEX.test(location)) {
    let path = resolvePath(location);
    return path.pathname + path.search + path.hash;
  }

  return location;
}
