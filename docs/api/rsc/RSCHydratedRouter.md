---
title: RSCHydratedRouter
unstable: true
---

# unstable_RSCHydratedRouter

[MODES: data]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in
minor/patch releases. Please use with caution and pay **very** close attention
to release notes for relevant changes.</docs-warning>

## Summary

Hydrates a server rendered `RSCPayload` in the browser.

```tsx filename=entry.browser.tsx
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import {
  unstable_getRSCStream as getRSCStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
} from "react-router";
import type { unstable_RSCPayload as RSCPayload } from "react-router";

createFromReadableStream(getRSCStream()).then(
  (payload: RSCServerPayload) => {
    startTransition(async () => {
      hydrateRoot(
        document,
        <StrictMode>
          <RSCHydratedRouter
            createFromReadableStream={
              createFromReadableStream
            }
            payload={payload}
          />
        </StrictMode>,
        {
          formState: await getFormState(payload),
        }
      );
    });
  }
);
```

## Props

### createFromReadableStream

Your `react-server-dom-xyz/client`'s `createFromReadableStream` function, used to decode payloads from the server.

### payload

The decoded `RSCPayload` to hydrate.

### routeDiscovery

`eager` or `lazy` - Determines if links are eagerly discovered, or delayed until clicked.

### unstable_getContext

A function that returns an `unstable_InitialContext` object (`Map<RouterContext, unknown>`), for use in client loaders, actions and middleware.
