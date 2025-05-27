/// <reference types="@cloudflare/workers-types" />
import {
  type unstable_DecodeCallServerFunction as DecodeCallServerFunction,
  unstable_matchRSCServerRequest as matchRSCServerRequest,
} from "react-router/rsc";
// @ts-expect-error - no types yet
import { manifest } from "virtual:react-manifest";

import { decodeReply, renderToReadableStream } from "../framework/server";
import { routes } from "./routes";

const decodeCallServer: DecodeCallServerFunction = async (actionId, reply) => {
  const args = await decodeReply(reply);
  const reference = manifest.resolveServerReference(actionId);
  await reference.preload();
  const action = reference.get() as (...args: unknown[]) => Promise<unknown>;
  return action.bind(null, ...args);
};

export default {
  fetch(request, env) {
    return matchRSCServerRequest({
      decodeCallServer,
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
  },
} satisfies ExportedHandler;
