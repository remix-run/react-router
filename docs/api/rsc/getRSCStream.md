---
title: getRSCStream
unstable: true
---

# getRSCStream

[MODES: data]

## Summary

Get the prerendered RSC stream for hydration. Usually passed directly to your `react-server-dom-xyz/client`'s `createFromReadableStream`.

The usage of this may differ slightly based on your bundler choice. Here's how it's used with Parcel via `react-server-dom-parcel/client`:

```tsx filename=entry.browser.tsx lines=[7,26]
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
