import {
  redirect,
  json,
  isDeferredData,
  isResponse,
  isRedirectStatusCode,
} from "./responses";
import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from "./routeModules";

/**
 * An object of unknown type for route loaders and actions provided by the
 * server's `getLoadContext()` function.  This is defined as an empty interface
 * specifically so apps can leverage declaration merging to augment this type
 * globally: https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 */
export interface AppLoadContext {
  [key: string]: unknown;
}

/**
 * Data for a route that was returned from a `loader()`.
 */
export type AppData = unknown;

export async function callRouteActionRR({
  loadContext,
  action,
  params,
  request,
  routeId,
}: {
  request: Request;
  action: ActionFunction;
  params: ActionFunctionArgs["params"];
  loadContext: AppLoadContext;
  routeId: string;
}) {
  let result = await action({
    request: stripDataParam(stripIndexParam(request)),
    context: loadContext,
    params,
  });

  if (result === undefined) {
    throw new Error(
      `You defined an action for route "${routeId}" but didn't return ` +
        `anything from your \`action\` function. Please return a value or \`null\`.`
    );
  }

  return isResponse(result) ? result : json(result);
}

export async function callRouteLoaderRR({
  loadContext,
  loader,
  params,
  request,
  routeId,
}: {
  request: Request;
  loader: LoaderFunction;
  params: LoaderFunctionArgs["params"];
  loadContext: AppLoadContext;
  routeId: string;
}) {
  let result = await loader({
    request: stripDataParam(stripIndexParam(request)),
    context: loadContext,
    params,
  });

  if (result === undefined) {
    throw new Error(
      `You defined a loader for route "${routeId}" but didn't return ` +
        `anything from your \`loader\` function. Please return a value or \`null\`.`
    );
  }

  if (isDeferredData(result)) {
    if (result.init && isRedirectStatusCode(result.init.status || 200)) {
      return redirect(
        new Headers(result.init.headers).get("Location")!,
        result.init
      );
    }
    return result;
  }

  return isResponse(result) ? result : json(result);
}

// TODO: Document these search params better
// and stop stripping these in V2. These break
// support for running in a SW and also expose
// valuable info to data funcs that is being asked
// for such as "is this a data request?".
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

function stripDataParam(request: Request) {
  let url = new URL(request.url);
  url.searchParams.delete("_data");
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
