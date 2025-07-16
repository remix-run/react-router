---
title: createCallServer
unstable: true
---

# unstable_createCallServer

[MODES: data]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in
minor/patch releases. Please use with caution and pay **very** close attention
to release notes for relevant changes.</docs-warning>

## Summary

Create a React `callServer` implementation for React Router.

```tsx filename=entry.browser.tsx
import {
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
} from "@vitejs/plugin-rsc/browser";
import { unstable_createCallServer as createCallServer } from "react-router";

setServerCallback(
  createCallServer({
    createFromReadableStream,
    createTemporaryReferenceSet,
    encodeReply,
  })
);
```

## Options

### createFromReadableStream

Your `react-server-dom-xyz/client`'s `createFromReadableStream`. Used to decode payloads from the server.

### encodeReply

Your `react-server-dom-xyz/client`'s `encodeReply`. Used when sending payloads to the server.
