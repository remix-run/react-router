"use server-entry";

import "./entry.browser";

import { matchRSCServerRequest } from "react-router/rsc";
// @ts-expect-error
import { renderToReadableStream } from "react-server-dom-parcel/server.edge";

import { routes } from "./routes";

export async function callServer(request: Request) {
  const match = await matchRSCServerRequest({
    request,
    routes,
  });
  if (match instanceof Response) {
    return match;
  }

  return new Response(renderToReadableStream(match.payload), {
    status: match.statusCode,
    headers: match.headers,
  });
}
