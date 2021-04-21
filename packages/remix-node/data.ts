import type { Params } from "react-router";

import type { ServerBuild } from "./build";
import type { Request } from "./fetch";
import { Response } from "./fetch";
import { json } from "./responses";
import type { AppLoadContext } from "./routes";

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

  let result = await routeModule.loader({ request, context, params });

  if (result === undefined) {
    throw new Error(
      `You defined a loader for route "${routeId}" but didn't return ` +
        `anything from your \`loader\` function. We can't do everything for you! 😅`
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

  let result = await routeModule.action({ request, context, params });

  if (!isResponse(result) || result.headers.get("Location") == null) {
    throw new Error(
      `You made a ${request.method} request to ${request.url} but did not return ` +
        `a redirect. Please \`return redirect(newUrl)\` from your \`action\` ` +
        `function to avoid reposts when users click the back button.`
    );
  }

  return new Response("", {
    status: 303,
    headers: result.headers
  });
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
