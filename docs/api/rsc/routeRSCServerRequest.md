---
title: routeRSCServerRequest
unstable: true
---

# routeRSCServerRequest

[MODES: data]

## Summary

Routes the incoming request to the RSC server and appropriately proxies the server response for data / resource requests, or renders to HTML for a document request.

```ts filename=entry.ssr.tsx lines=[5,16-32]
import { createRequestListener } from "@mjackson/node-fetch-server";
import express from "express";
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge" assert { env: "react-client" };
import {
  unstable_routeRSCServerRequest as routeRSCServerRequest,
  unstable_RSCStaticRouter as RSCStaticRouter,
} from "react-router" assert { env: "react-client" };
import { createFromReadableStream } from "react-server-dom-parcel/client.edge" assert { env: "react-client" };

import { fetchServer } from "./entry.rsc" assert { env: "react-server" };

const app = express();

app.use(
  createRequestListener(async (request) => {
    return routeRSCServerRequest({
      request,
      fetchServer,
      createFromReadableStream,
      async renderHTML(getPayload) {
        return await renderHTMLToReadableStream(
          <RSCStaticRouter getPayload={getPayload} />,
          {
            bootstrapScriptContent: (
              fetchServer as unknown as {
                bootstrapScript: string;
              }
            ).bootstrapScript,
          }
        );
      },
    });
  })
);
```

## Options

### createFromReadableStream

Your `react-server-dom-xyz/client`'s `createFromReadableStream` function, used to decode payloads from the server.

### fetchServer

A function that forwards a `Request` to the RSC handler and returns a `Promise<Response>` containing a serialized `RSCPayload`.

### renderHTML

A function that renders the `RSCPayload` to HTML, usually using a `<RSCStaticRouter>`.

### request

The request to route.
