"use server-entry";

import {
  decodeAction,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
  // @ts-expect-error
} from "react-server-dom-parcel/server.edge";
import {
  type unstable_DecodeCallServerFunction,
  type unstable_DecodeFormActionFunction,
  unstable_matchRSCServerRequest,
} from "react-router/rsc";

import routes from "virtual:react-router/routes";

import "./entry.browser.tsx";

const decodeCallServer: unstable_DecodeCallServerFunction = async (
  actionId,
  reply
) => {
  const args = await decodeReply(reply);
  const action = await loadServerAction(actionId);
  return action.bind(null, ...args);
};

const decodeFormAction: unstable_DecodeFormActionFunction = async (
  formData
) => {
  return await decodeAction(formData);
};

export function callServer(request: Request) {
  return unstable_matchRSCServerRequest({
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
