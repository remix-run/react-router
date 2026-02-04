import type {
  LoaderFunction,
  ActionFunction,
  LoaderFunctionArgs,
  ActionFunctionArgs,
} from "../router/utils";
import type { FutureConfig } from "../router/router";
import { isDataWithResponseInit, isRedirectStatusCode } from "../router/router";

/**
 * An object of unknown type for route loaders and actions provided by the
 * server's `getLoadContext()` function.  This is defined as an empty interface
 * specifically so apps can leverage declaration merging to augment this type
 * globally: https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 */
export interface AppLoadContext {
  [key: string]: unknown;
}

// Need to use RR's version here to permit the optional context even
// though we know it'll always be provided in remix
export async function callRouteHandler(
  handler: LoaderFunction | ActionFunction,
  args: LoaderFunctionArgs | ActionFunctionArgs,
  future: FutureConfig,
) {
  let result = await handler({
    request: future.unstable_passThroughRequests
      ? args.request
      : stripRoutesParam(stripIndexParam(args.request)),
    unstable_url: args.unstable_url,
    params: args.params,
    context: args.context,
    unstable_pattern: args.unstable_pattern,
  });

  // If they returned a redirect via data(), re-throw it as a Response
  if (
    isDataWithResponseInit(result) &&
    result.init &&
    result.init.status &&
    isRedirectStatusCode(result.init.status)
  ) {
    throw new Response(null, result.init);
  }

  return result;
}

function stripIndexParam(request: Request) {
  let url = new URL(request.url);
  let indexValues = url.searchParams.getAll("index");
  url.searchParams.delete("index");
  let indexValuesToKeep = [];
  for (let indexValue of indexValues) {
    if (indexValue) {
      indexValuesToKeep.push(indexValue);
    }
  }
  for (let toKeep of indexValuesToKeep) {
    url.searchParams.append("index", toKeep);
  }

  let init: RequestInit = {
    method: request.method,
    body: request.body,
    headers: request.headers,
    signal: request.signal,
  };

  if (init.body) {
    (init as { duplex: "half" }).duplex = "half";
  }

  return new Request(url.href, init);
}

function stripRoutesParam(request: Request) {
  let url = new URL(request.url);
  url.searchParams.delete("_routes");
  let init: RequestInit = {
    method: request.method,
    body: request.body,
    headers: request.headers,
    signal: request.signal,
  };

  if (init.body) {
    (init as { duplex: "half" }).duplex = "half";
  }

  return new Request(url.href, init);
}
