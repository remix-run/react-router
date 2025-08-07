---
title: Meta
---

# Meta

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/ssr/components.tsx
-->

[MODES: framework]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.Meta.html)

Renders all the [`<meta>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta)
tags created by the route module's [`meta`](../../start/framework/route-module#meta)
export. You should render it inside the [`<head>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head)
of your document.

```tsx
import { Meta } from "react-router";

export default function Root() {
  return (
    <html>
      <head>
        <Meta />
      </head>
    </html>
  );
}
```

## Signature

```tsx
function Meta(): React.JSX.Element
```

