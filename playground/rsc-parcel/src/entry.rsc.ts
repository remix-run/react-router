"use server-entry";

import {
  decodeAction,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
  // @ts-expect-error
} from "react-server-dom-parcel/server.edge";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";

import { routes } from "./routes";

import "./entry.browser.tsx";

export function fetchServer(request: Request) {
  return matchRSCServerRequest({
    decodeReply,
    decodeAction,
    loadServerAction,
    request,
    routes,
    generateResponse(match) {
      return new Response(renderToReadableStream(match.payload), {
        status: match.statusCode,
        headers: match.headers,
      });
    },
  });
}
