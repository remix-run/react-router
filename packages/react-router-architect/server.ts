import type { AppLoadContext, ServerBuild } from "react-router";
import { createRequestHandler as createReactRouterRequestHandler } from "react-router";
import { readableStreamToString } from "@react-router/node";
import type {
  APIGatewayProxyEventHeaders,
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

import { isBinaryType } from "./binaryTypes";

/**
 * A function that returns the value to use as `context` in route `loader` and
 * `action` functions.
 *
 * You can think of this as an escape hatch that allows you to pass
 * environment/platform-specific values through to your loader/action.
 */
export type GetLoadContextFunction = (
  event: APIGatewayProxyEventV2
) => Promise<AppLoadContext> | AppLoadContext;

export type RequestHandler = APIGatewayProxyHandlerV2;

/**
 * Returns a request handler for Architect that serves the response using
 * React Router.
 */
export function createRequestHandler({
  build,
  getLoadContext,
  mode = process.env.NODE_ENV,
}: {
  build: ServerBuild;
  getLoadContext?: GetLoadContextFunction | undefined;
  mode?: string | undefined;
}): RequestHandler {
  const handleRequest = createReactRouterRequestHandler(build, mode);

  return async (event) => {
    const request = createReactRouterRequest(event);
    const loadContext = await getLoadContext?.(event);

    const response = await handleRequest(request, loadContext);

    return sendReactRouterResponse(response);
  };
}

export function createReactRouterRequest(
  event: APIGatewayProxyEventV2
): Request {
  const host = event.headers["x-forwarded-host"] || event.headers.host;
  const search = event.rawQueryString.length ? `?${event.rawQueryString}` : "";
  const scheme = process.env.ARC_SANDBOX ? "http" : "https";
  const url = new URL(`${scheme}://${host}${event.rawPath}${search}`);
  const isFormData = event.headers["content-type"]?.includes(
    "multipart/form-data"
  );
  // Note: No current way to abort these for Architect, but our router expects
  // requests to contain a signal, so it can detect aborted requests
  const controller = new AbortController();

  return new Request(url.href, {
    method: event.requestContext.http.method,
    headers: createReactRouterHeaders(event.headers, event.cookies),
    signal: controller.signal,
    body:
      event.body && event.isBase64Encoded
        ? isFormData
          ? Buffer.from(event.body, "base64")
          : Buffer.from(event.body, "base64").toString()
        : event.body,
  });
}

export function createReactRouterHeaders(
  requestHeaders: APIGatewayProxyEventHeaders,
  requestCookies?: string[] | undefined
): Headers {
  const headers = new Headers();

  for (let [header, value] of Object.entries(requestHeaders)) {
    if (value) {
      headers.append(header, value);
    }
  }

  if (requestCookies) {
    headers.append("Cookie", requestCookies.join("; "));
  }

  return headers;
}

export async function sendReactRouterResponse(
  nodeResponse: Response
): Promise<APIGatewayProxyStructuredResultV2> {
  const cookies: string[] = [];

  // Arc/AWS API Gateway will send back set-cookies outside of response headers.
  for (let [key, value] of nodeResponse.headers.entries()) {
    if (key.toLowerCase() === "set-cookie") {
      cookies.push(value);
    }
  }

  if (cookies.length) {
    nodeResponse.headers.delete("Set-Cookie");
  }

  const contentType = nodeResponse.headers.get("Content-Type");
  const isBase64Encoded = isBinaryType(contentType);
  let body: string | undefined;

  if (nodeResponse.body) {
    if (isBase64Encoded) {
      body = await readableStreamToString(nodeResponse.body, "base64");
    } else {
      body = await nodeResponse.text();
    }
  }

  return {
    statusCode: nodeResponse.status,
    headers: Object.fromEntries(nodeResponse.headers.entries()),
    cookies,
    body,
    isBase64Encoded,
  };
}
