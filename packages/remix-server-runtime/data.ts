import type { Params } from "react-router";

import type { ServerBuild } from "./build";
import { json } from "./responses";

/**
 * An object of arbitrary for route loaders and actions provided by the
 * server's `getLoadContext()` function.
 */
export type AppLoadContext = any;

/**
 * Data for a route that was returned from a `loader()`.
 */
export type AppData = any;

export async function loadRouteData(
  build: ServerBuild,
  routeId: string,
  request: Request,
  context: AppLoadContext,
  params: Params
): Promise<Response> {
  let routeModule = build.routes[routeId].module;

  if (!routeModule.loader) {
    return Promise.resolve(json(null));
  }

  let result;

  try {
    result = await routeModule.loader({ request, context, params });
  } catch (error) {
    if (!isResponse(error)) {
      throw error;
    }

    error.headers.set("X-Remix-Catch", "yes");
    result = error;
  }

  if (result === undefined) {
    throw new Error(
      `You defined a loader for route "${routeId}" but didn't return ` +
        `anything from your \`loader\` function. Please return a value or \`null\`.`
    );
  }

  return isResponse(result) ? result : json(result);
}

export async function callRouteAction(
  build: ServerBuild,
  routeId: string,
  request: Request,
  context: AppLoadContext,
  params: Params
): Promise<Response> {
  let routeModule = build.routes[routeId].module;

  if (!routeModule.action) {
    throw new Error(
      `You made a ${request.method} request to ${request.url} but did not provide ` +
        `an \`action\` for route "${routeId}", so there is no way to handle the ` +
        `request.`
    );
  }

  let result;
  try {
    result = await routeModule.action({ request, context, params });
  } catch (error) {
    if (!isResponse(error)) {
      throw error;
    }

    error.headers.set("X-Remix-Catch", "yes");
    result = error;
  }

  if (result === undefined) {
    throw new Error(
      `You defined an action for route "${routeId}" but didn't return ` +
        `anything from your \`action\` function. Please return a value or \`null\`.`
    );
  }

  return isResponse(result) ? result : json(result);
}

export function isCatchResponse(value: any) {
  return isResponse(value) && value.headers.get("X-Remix-Catch") != null;
}

function isResponse(value: any): value is Response {
  return (
    value != null &&
    typeof value.status === "number" &&
    typeof value.statusText === "string" &&
    typeof value.headers === "object" &&
    typeof value.body !== "undefined"
  );
}

export function extractData(response: Response): Promise<AppData> {
  let contentType = response.headers.get("Content-Type");

  if (contentType && /\bapplication\/json\b/.test(contentType)) {
    return response.json();
  }

  // What other data types do we need to handle here? What other kinds of
  // responses are people going to be returning from their loaders?
  // - application/x-www-form-urlencoded ?
  // - multipart/form-data ?
  // - binary (audio/video) ?

  return response.text();
}
