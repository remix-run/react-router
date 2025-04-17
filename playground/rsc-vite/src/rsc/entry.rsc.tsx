/// <reference types="@cloudflare/workers-types" />

import { decodeReply, renderToReadableStream } from "../../framework/server";
// @ts-expect-error - no types yet
import { manifest } from "virtual:react-manifest";

import {
  type DecodeCallServerFunction,
  matchRSCServerRequest,
} from "react-router/rsc";

import { routes } from "../routes";

const decodeCallServer: DecodeCallServerFunction = async (actionId, reply) => {
  const args = await decodeReply(reply);
  const reference = manifest.resolveServerReference(actionId);
  await reference.preload();
  const action = reference.get() as (...args: unknown[]) => Promise<unknown>;
  return action.bind(null, ...args);
};

export default {
  async fetch(request, env) {
    const match = await matchRSCServerRequest({
      decodeCallServer,
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
  },
} satisfies ExportedHandler;
