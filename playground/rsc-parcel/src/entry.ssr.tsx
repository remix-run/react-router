import { createRequestListener } from "@mjackson/node-fetch-server";
import express from "express";
// @ts-expect-error - no types
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge" assert { env: "react-client" };
import {
  unstable_routeRSCServerRequest as routeRSCServerRequest,
  unstable_RSCStaticRouter as RSCStaticRouter,
} from "react-router" assert { env: "react-client" };
// @ts-expect-error
import { createFromReadableStream } from "react-server-dom-parcel/client.edge" assert { env: "react-client" };

import { fetchServer } from "./entry.rsc" assert { env: "react-server" };

const app = express();

app.use("/client", express.static("dist/client"));

app.use(
  createRequestListener(async (request) => {
    return routeRSCServerRequest({
      request,
      serverResponse: await fetchServer(request),
      createFromReadableStream,
      async renderHTML(getPayload, options) {
        const payload = getPayload();

        return await renderHTMLToReadableStream(
          <RSCStaticRouter getPayload={getPayload} />,
          {
            ...options,
            bootstrapScriptContent: (
              fetchServer as unknown as { bootstrapScript: string }
            ).bootstrapScript,
            formState: await payload.formState,
          },
        );
      },
    });
  }),
);

const server = app.listen(3000);
console.log("Server listening on port 3000 (http://localhost:3000)");

// Restart the server when it changes.
if (module.hot) {
  module.hot.dispose(() => {
    server.close();
  });

  module.hot.accept();
}
