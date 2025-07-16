---
title: getRSCStream
unstable: true
---

# unstable_getRSCStream

[MODES: data]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in
minor/patch releases. Please use with caution and pay **very** close attention
to release notes for relevant changes.</docs-warning>

## Summary

Get the prerendered RSC stream for hydration. Usually passed directly to your `react-server-dom-xyz/client`'s `createFromReadableStream`.

```tsx filename=entry.browser.ts
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
          <RSCHydratedRouter /* props */ />
        </StrictMode>,
        {
          /* ... */
        }
      );
    });
  }
);
```
