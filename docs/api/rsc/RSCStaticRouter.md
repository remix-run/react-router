---
title: RSCStaticRouter
unstable: true
---

# RSCStaticRouter

[MODES: data]

## Summary

Pre-renders an `RSCPayload` to HTML. Usually used in `routeRSCServerRequest`'s `renderHTML` callback.

```ts filename=entry.ssr.tsx lines=[6,22]
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

## Props

### getPayload

A function that starts decoding of the `RSCPayload`. Usually passed through from `routeRSCServerRequest`'s `renderHTML`.
