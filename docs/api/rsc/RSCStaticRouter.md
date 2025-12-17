---
title: RSCStaticRouter
unstable: true
---

# unstable_RSCStaticRouter

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.unstable_RSCStaticRouter.html)

Pre-renders an [`unstable_RSCPayload`](https://api.reactrouter.com/v7/types/react_router.unstable_RSCPayload.html) to HTML. Usually used in
[`unstable_routeRSCServerRequest`](../rsc/routeRSCServerRequest)'s `renderHTML` callback.

```tsx
import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
import * as ReactDomServer from "react-dom/server.edge";
import {
  unstable_RSCStaticRouter as RSCStaticRouter,
  unstable_routeRSCServerRequest as routeRSCServerRequest,
} from "react-router";

routeRSCServerRequest({
  request,
  serverResponse,
  createFromReadableStream,
  async renderHTML(getPayload) {
    const payload = getPayload();

    return await renderHTMLToReadableStream(
      <RSCStaticRouter getPayload={getPayload} />,
      {
        bootstrapScriptContent,
        formState: await payload.formState,
      }
    );
  },
});
```

## Signature

```tsx
function RSCStaticRouter({ getPayload }: RSCStaticRouterProps)
```

## Props

### getPayload

A function that starts decoding of the [`unstable_RSCPayload`](https://api.reactrouter.com/v7/types/react_router.unstable_RSCPayload.html). Usually passed
through from [`unstable_routeRSCServerRequest`](../rsc/routeRSCServerRequest)'s `renderHTML`.

