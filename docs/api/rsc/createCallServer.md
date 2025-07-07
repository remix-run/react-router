---
title: createCallServer
unstable: true
---

# createCallServer

[MODES: data]

## Summary

Create a React `callServer` implementation for React Router.

The usage of this may differ slightly based on your bundler choice. Here's how it's used with Parcel via `react-server-dom-parcel/client`:

```tsx filename=entry.browser.tsx lines=[6,19-23]
"use client-entry";

import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import {
  unstable_createCallServer as createCallServer,
  unstable_getRSCStream as getRSCStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
} from "react-router";
import type { unstable_RSCPayload as RSCPayload } from "react-router";
import {
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
} from "react-server-dom-parcel/client";

setServerCallback(
  createCallServer({
    createFromReadableStream,
    createTemporaryReferenceSet,
    encodeReply,
  })
);

createFromReadableStream(getRSCStream(), {
  assets: "manifest",
}).then((payload: RSCPayload) => {
  React.startTransition(() => {
    hydrateRoot(
      document,
      <React.StrictMode>
        <RSCHydratedRouter
          payload={payload}
          routeDiscovery="eager"
          createFromReadableStream={
            createFromReadableStream
          }
        />
      </React.StrictMode>
    );
  });
});
```

## Options

### createFromReadableStream

Your `react-server-dom-xyz/client`'s `createFromReadableStream`. Used to decode payloads from the server.

### encodeReply

Your `react-server-dom-xyz/client`'s `encodeReply`. Used when sending payloads to the server.
