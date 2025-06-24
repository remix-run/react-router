import {
  decodeAction,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "@hiogawa/vite-rsc/rsc";
import {
  type unstable_DecodeCallServerFunction as DecodeCallServerFunction,
  type unstable_DecodeFormActionFunction as DecodeFormActionFunction,
  unstable_matchRSCServerRequest as matchRSCServerRequest,
} from "react-router";

import { routes } from "./routes";

const decodeCallServer: DecodeCallServerFunction = async (actionId, reply) => {
  const args = await decodeReply(reply);
  const action = await loadServerAction(actionId);
  return action.bind(null, ...args);
};

const decodeFormAction: DecodeFormActionFunction = async (formData) => {
  return await decodeAction(formData);
};

export async function callServer(request: Request) {
  return await matchRSCServerRequest({
    decodeCallServer,
    decodeFormAction,
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

export default async function handler(request: Request) {
  const ssr = await import.meta.viteRsc.loadModule<
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    typeof import("./entry.ssr")
  >("ssr", "index");
  return ssr.default(request, callServer);
}
