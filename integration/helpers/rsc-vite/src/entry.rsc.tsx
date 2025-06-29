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
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    typeof import("./entry.ssr")
  >("ssr", "index");
  return ssr.default(request, fetchServer);
}
