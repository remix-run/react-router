const ERROR_DIGEST_BASE = "REACT_ROUTER_ERROR";
const ERROR_DIGEST_REDIRECT = "REDIRECT";

export function createRedirectErrorDigest(response: Response) {
  return `${ERROR_DIGEST_BASE}:${ERROR_DIGEST_REDIRECT}:${JSON.stringify({
    status: response.status,
    statusText: response.statusText,
    location: response.headers.get("Location"),
    reloadDocument: response.headers.get("X-Remix-Reload-Document") === "true",
    replace: response.headers.get("X-Remix-Replace") === "true",
  })}`;
}

export function decodeRedirectErrorDigest(digest: string):
  | undefined
  | {
      status: number;
      statusText: string;
      location: string;
      reloadDocument: boolean;
      replace: boolean;
    } {
  if (digest.startsWith(`${ERROR_DIGEST_BASE}:${ERROR_DIGEST_REDIRECT}:{`)) {
    try {
      let parsed = JSON.parse(digest.slice(28));
      if (
        typeof parsed === "object" &&
        parsed &&
        typeof parsed.status === "number" &&
        typeof parsed.statusText === "string" &&
        typeof parsed.location === "string" &&
        typeof parsed.reloadDocument === "boolean" &&
        typeof parsed.replace === "boolean"
      ) {
        return parsed;
      }
    } catch {}
  }
}
