---
title: RSCHydratedRouter
unstable: true
---

# RSCHydratedRouter

[MODES: data]

## Summary

Hydrates a server rendered `RSCPayload` in the browser.

```tsx filename=entry.browser.tsx lines=[8,33-39]
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

## Props

### createFromReadableStream

Your `react-server-dom-xyz/client`'s `createFromReadableStream` function, used to decode payloads from the server.

### payload

The decoded `RSCPayload` to hydrate.

### routeDiscovery

`eager` or `lazy` - Determines if links are eagerly discovered, or delayed until clicked.
