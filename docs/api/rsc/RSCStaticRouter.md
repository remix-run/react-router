---
title: RSCStaticRouter
unstable: true
---

# unstable_RSCStaticRouter

[MODES: data]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in
minor/patch releases. Please use with caution and pay **very** close attention
to release notes for relevant changes.</docs-warning>

## Summary

Pre-renders an `RSCPayload` to HTML. Usually used in `routeRSCServerRequest`'s `renderHTML` callback.

```tsx filename=entry.ssr.tsx
import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
// @ts-expect-error
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

## Props

### getPayload

A function that starts decoding of the `RSCPayload`. Usually passed through from `routeRSCServerRequest`'s `renderHTML`.
