"use server-entry";

import "./entry.browser";

import { matchRSCServerRequest } from "react-router/rsc";
// @ts-expect-error
import { renderToReadableStream } from "react-server-dom-parcel/server.edge";

import { routes } from "./routes";

export function callServer(request: Request) {
  return matchRSCServerRequest({
    request,
    routes,
    generateResponse(match) {
      if (match instanceof Response) {
        return match;
      }

      return new Response(renderToReadableStream(match.payload), {
        status: match.statusCode,
        headers: match.headers,
      });
    },
  });
}
