---
title: routeRSCServerRequest
unstable: true
---

# unstable_routeRSCServerRequest

[MODES: data]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in
minor/patch releases. Please use with caution and pay **very** close attention
to release notes for relevant changes.</docs-warning>

## Summary

Routes the incoming request to the RSC server and appropriately proxies the server response for data / resource requests, or renders to HTML for a document request.

```tsx filename=entry.ssr.tsx
import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
import * as ReactDomServer from "react-dom/server.edge";
import {
  unstable_RSCStaticRouter as RSCStaticRouter,
  unstable_routeRSCServerRequest as routeRSCServerRequest,
} from "react-router";

routeRSCServerRequest({
  request,
  fetchServer,
  createFromReadableStream,
  async renderHTML(getPayload) {
    const payload = await getPayload();

    return await renderHTMLToReadableStream(
      <RSCStaticRouter getPayload={getPayload} />,
      {
        bootstrapScriptContent,
        formState: await getFormState(payload),
      }
    );
  },
});
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
