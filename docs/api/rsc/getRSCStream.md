---
title: getRSCStream
unstable: true
---

# unstable_getRSCStream

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/rsc/html-stream/browser.ts
-->

[MODES: data]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in 
minor/patch releases. Please use with caution and pay **very** close attention 
to release notes for relevant changes.</docs-warning>

## Summary

Get the prerendered [RSC](https://react.dev/reference/rsc/server-components)
stream for hydration. Usually passed directly to your
`react-server-dom-xyz/client`'s `createFromReadableStream`.

```tsx
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
          <RSCHydratedRouter {...props} />
        </StrictMode>,
        {
          // Options
        }
      );
    });
  }
);
```

## Signature

```tsx
function getRSCStream(): ReadableStream
```

## Returns

A [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
that contains the [RSC](https://react.dev/reference/rsc/server-components)
data for hydration.

