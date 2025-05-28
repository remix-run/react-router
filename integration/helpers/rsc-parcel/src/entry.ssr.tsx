import { parseArgs } from "node:util";
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

import { callServer } from "./entry.rsc" assert { env: "react-server" };

const app = express();

app.use("/client", express.static("dist/client"));

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.status(404);
  res.end();
});

app.use(
  createRequestListener(async (request) => {
    return routeRSCServerRequest({
      request,
      callServer,
      decode: createFromReadableStream,
      async renderHTML(getPayload) {
        return await renderHTMLToReadableStream(
          <RSCStaticRouter getPayload={getPayload} />,
          {
            bootstrapScriptContent: (
              callServer as unknown as { bootstrapScript: string }
            ).bootstrapScript,
          }
        );
      },
    });
  })
);

const port = parseInt(process.env.RR_PORT || "3000", 10);
const server = app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

// Restart the server when it changes.
if (module.hot) {
  module.hot.dispose(() => {
    server.close();
  });

  module.hot.accept();
}
