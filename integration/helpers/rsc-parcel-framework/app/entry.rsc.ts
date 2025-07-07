"use server-entry";

import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
  // @ts-expect-error
} from "react-server-dom-parcel/server.edge";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";

import routes from "virtual:react-router/routes";

import "./entry.browser.tsx";

export function fetchServer(request: Request) {
  return matchRSCServerRequest({
    createTemporaryReferenceSet,
    decodeAction,
    decodeReply,
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
