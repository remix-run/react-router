---
title: Links
---

# Links

[MODES: framework]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.Links.html)

Renders all of the `<link>` tags created by route module [`links`](../../start/framework/route-module#links) export. You should render it inside the `<head>` of your document.

```tsx
import { Links } from "react-router";

export default function Root() {
  return (
    <html>
      <head>
        <Links />
      </head>
      <body></body>
    </html>
  );
}
```

## Props

None
