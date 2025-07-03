import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "@hiogawa/vite-rsc/rsc";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";

import { routes } from "./routes";

export async function fetchServer(request: Request) {
  return await matchRSCServerRequest({
    createTemporaryReferenceSet,
    decodeReply,
    decodeAction,
    loadServerAction,
    request,
    // @ts-expect-error
    routes,
    generateResponse(match, options) {
      return new Response(renderToReadableStream(match.payload, options), {
        status: match.statusCode,
        headers: match.headers,
      });
    },
  });
}

export default async function handler(request: Request) {
  const ssr = await import.meta.viteRsc.loadModule<
    typeof import("./entry.ssr")
  >("ssr", "index");
  return ssr.default(request, fetchServer);
}
