import * as React from "react";
// @ts-expect-error - no types
import { renderToReadableStream } from "react-dom/server.edge" assert { env: "react-client" };
import {
  unstable_routeRSCServerRequest,
  unstable_RSCStaticRouter,
} from "react-router" assert { env: "react-client" };
// @ts-expect-error
import { createFromReadableStream } from "react-server-dom-parcel/client.edge" assert { env: "react-client" };

import { fetchServer } from "./entry.rsc" assert { env: "react-server" };

export const requestHandler = async (request: Request) => {
  return unstable_routeRSCServerRequest({
    request,
    fetchServer,
    createFromReadableStream,
    async renderHTML(getPayload) {
      const payload = await getPayload();
      const formState =
        payload.type === "render" ? await payload.formState : undefined;

      return await renderToReadableStream(
        React.createElement(unstable_RSCStaticRouter, { getPayload }),
        {
          bootstrapScriptContent: (
            fetchServer as unknown as { bootstrapScript: string }
          ).bootstrapScript,
          formState,
        },
      );
    },
  });
};
