---
title: RSCHydratedRouter
unstable: true
---

# unstable_RSCHydratedRouter

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/rsc/browser.tsx
-->

[MODES: data]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in 
minor/patch releases. Please use with caution and pay **very** close attention 
to release notes for relevant changes.</docs-warning>

## Summary

Hydrates a server rendered [`unstable_RSCPayload`](https://api.reactrouter.com/v7/types/react_router.unstable_RSCPayload.html) in the browser.

```tsx
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import {
  unstable_getRSCStream as getRSCStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
} from "react-router";
import type { unstable_RSCPayload as RSCPayload } from "react-router";

createFromReadableStream(getRSCStream()).then((payload) =>
  startTransition(async () => {
    hydrateRoot(
      document,
      <StrictMode>
        <RSCHydratedRouter
          createFromReadableStream={createFromReadableStream}
          payload={payload}
        />
      </StrictMode>,
      { formState: await getFormState(payload) },
    );
  }),
);
```

## Signature

```tsx
function RSCHydratedRouter({
  createFromReadableStream,
  fetch: fetchImplementation = fetch,
  payload,
  routeDiscovery = "eager",
  getContext,
}: RSCHydratedRouterProps)
```

## Props

### createFromReadableStream

Your `react-server-dom-xyz/client`'s `createFromReadableStream` function,
used to decode payloads from the server.

### fetch

Optional fetch implementation. Defaults to global [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch).

### getContext

A function that returns an [`RouterContextProvider`](../utils/RouterContextProvider) instance
which is provided as the `context` argument to client [`action`](../../start/data/route-object#action)s,
[`loader`](../../start/data/route-object#loader)s and [middleware](../../how-to/middleware).
This function is called to generate a fresh `context` instance on each
navigation or fetcher call.

### payload

The decoded [`unstable_RSCPayload`](https://api.reactrouter.com/v7/types/react_router.unstable_RSCPayload.html) to hydrate.

### routeDiscovery

`"eager"` or `"lazy"` - Determines if links are eagerly discovered, or
delayed until clicked.

