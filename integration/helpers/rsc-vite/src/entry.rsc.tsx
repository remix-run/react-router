import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeFormState,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "@vitejs/plugin-rsc/rsc";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";
import { basename } from "./config/basename";

import { routes } from "./routes";
import { requestContext } from "./config/request-context";

export async function fetchServer(request: Request) {
  return await matchRSCServerRequest({
    createTemporaryReferenceSet,
    decodeReply,
    decodeAction,
    decodeFormState,
    loadServerAction,
    request,
    requestContext,
    routes,
    basename,
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
  return ssr.default(request, await fetchServer(request));
}
