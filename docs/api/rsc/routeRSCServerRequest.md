---
title: routeRSCServerRequest
unstable: true
---

# unstable_routeRSCServerRequest

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/rsc/server.ssr.tsx
-->

[MODES: data]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in
minor/patch releases. Please use with caution and pay **very** close attention
to release notes for relevant changes.</docs-warning>

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.unstable_routeRSCServerRequest.html)

Routes the incoming request to the RSC server and appropriately proxies the
server response for data / resource requests, or renders to HTML for a document
request.

```tsx
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
      },
    );
  },
});
```

## Signature

```tsx
async function routeRSCServerRequest({
  request,
  fetchServer,
  createFromReadableStream,
  renderHTML,
  hydrate = true,
}: {
  request: Request;
  fetchServer: (request: Request) => Promise<Response>;
  createFromReadableStream: SSRCreateFromReadableStreamFunction;
  renderHTML: (
    getPayload: () => Promise<RSCPayload>,
  ) =>
    | ReadableStream<Uint8Array>
    | Promise<ReadableStream<Uint8Array>>;
  hydrate?: boolean;
}): Promise<Response>;
```

## Params

### opts.createFromReadableStream

Your `react-server-dom-xyz/client`'s `createFromReadableStream` function, used to decode payloads from the server.

### opts.fetchServer

A function that forwards a `Request` to the RSC handler and returns a `Promise<Response>` containing a serialized `RSCPayload`.

### opts.renderHTML

A function that renders the `RSCPayload` to HTML, usually using a `<RSCStaticRouter>`.

### opts.request

The request to route.

### opts.hydrate

Whether to hydrate the server response with the RSC payload. Defaults to `true`.

## Returns

A `Response` that either contains the RSC payload for data requests, or
renders the HTML for document requests.
