import { isDataWithResponseInit } from "./router/router";
import { ErrorResponseImpl } from "./router/utils";
import type { DataWithResponseInit } from "./router/utils";

const ERROR_DIGEST_BASE = "REACT_ROUTER_ERROR"; // 18
const ERROR_DIGEST_REDIRECT = "REDIRECT"; // 8
const ERROR_DIGEST_ROUTE_ERROR_RESPONSE = "ROUTE_ERROR_RESPONSE"; // 20

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

export function createRouteErrorResponseDigest(
  response: DataWithResponseInit<unknown> | Response,
) {
  let status = 500;
  let statusText = "";
  let data: unknown;
  if (isDataWithResponseInit(response)) {
    status = response.init?.status ?? status;
    statusText = response.init?.statusText ?? statusText;
    data = response.data;
  } else {
    status = response.status;
    statusText = response.statusText;
    // We can't do async work here to read the response body.
    data = undefined;
  }

  return `${ERROR_DIGEST_BASE}:${ERROR_DIGEST_ROUTE_ERROR_RESPONSE}:${JSON.stringify(
    {
      status,
      statusText,
      data,
    },
  )}`;
}

export function decodeRouteErrorResponseDigest(
  digest: string,
): undefined | ErrorResponseImpl {
  if (
    digest.startsWith(
      `${ERROR_DIGEST_BASE}:${ERROR_DIGEST_ROUTE_ERROR_RESPONSE}:{`,
    )
  ) {
    try {
      let parsed = JSON.parse(digest.slice(40));
      if (
        typeof parsed === "object" &&
        parsed &&
        typeof parsed.status === "number" &&
        typeof parsed.statusText === "string"
      ) {
        return new ErrorResponseImpl(
          parsed.status,
          parsed.statusText,
          parsed.data,
        );
      }
    } catch {}
  }
}
