const ERROR_DIGEST_BASE = "REACT_ROUTER_ERROR";
const ERROR_DIGEST_REDIRECT = "REDIRECT";

export function createRedirectErrorDigest(response: Response) {
  return `${ERROR_DIGEST_BASE}:${ERROR_DIGEST_REDIRECT}:${JSON.stringify({
    status: response.status,
    location: response.headers.get("Location"),
  })}`;
}

export function decodeRedirectErrorDigest(
  digest: string,
): undefined | { status: number; location: string } {
  if (digest.startsWith(`${ERROR_DIGEST_BASE}:${ERROR_DIGEST_REDIRECT}:{`)) {
    try {
      let parsed = JSON.parse(digest.slice(28));
      if (
        typeof parsed === "object" &&
        parsed &&
        "status" in parsed &&
        typeof parsed.status === "number" &&
        "location" in parsed &&
        typeof parsed.location === "string"
      ) {
        return parsed;
      }
    } catch {}
  }
}
