---
title: Meta
---

# Meta

[MODES: framework]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.Meta.html)

Renders all the `<meta>` tags created by route module [`meta`](../../start/framework/route-module#meta) export. You should render it inside the `<head>` of your HTML.

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

## Props

None
