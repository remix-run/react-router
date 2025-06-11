import * as React from "react";
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge" assert { env: "react-client" };
import {
  unstable_routeRSCServerRequest,
  unstable_RSCStaticRouter,
} from "react-router" assert { env: "react-client" };
import { createFromReadableStream } from "react-server-dom-parcel/client.edge" assert { env: "react-client" };

import { callServer } from "./entry.rsc.ts" assert { env: "react-server" };

const requestHandler = async (request: Request) => {
  return unstable_routeRSCServerRequest({
    request,
    callServer,
    decode: createFromReadableStream,
    async renderHTML(getPayload) {
      return await renderHTMLToReadableStream(
        React.createElement(unstable_RSCStaticRouter, { getPayload }),
        {
          bootstrapScriptContent: (
            callServer as unknown as { bootstrapScript: string }
          ).bootstrapScript,
        }
      );
    },
  });
};

export default requestHandler;
