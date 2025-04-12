"use server-entry";

import "./browser";

import { matchServerRequest } from "react-router";
// @ts-expect-error
import { renderToReadableStream } from "react-server-dom-parcel/server.edge";

import { routes } from "./routes";

export async function callServer(request: Request) {
  const match = await matchServerRequest({
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
