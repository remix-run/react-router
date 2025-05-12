"use server-entry";

import {
  decodeAction,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
  // @ts-expect-error
} from "react-server-dom-parcel/server.edge";
import {
  type DecodeCallServerFunction,
  type DecodeFormActionFunction,
  matchRSCServerRequest,
} from "react-router/rsc";
import { unstable_ClientComponentPropsProvider } from "react-router" assert { env: "client" };

import { routes } from "./routes";

import "./entry.browser.tsx";

const decodeCallServer: DecodeCallServerFunction = async (actionId, reply) => {
  const args = await decodeReply(reply);
  const action = await loadServerAction(actionId);
  return action.bind(null, ...args);
};

const decodeFormAction: DecodeFormActionFunction = async (formData) => {
  return await decodeAction(formData);
};

export function callServer(request: Request) {
  return matchRSCServerRequest({
    decodeCallServer,
    decodeFormAction,
    request,
    // @ts-expect-error
    routes,
    unstable_ClientComponentPropsProvider,
    generateResponse(match) {
      return new Response(renderToReadableStream(match.payload), {
        status: match.statusCode,
        headers: match.headers,
      });
    },
  });
}
