---
title: Links
---

# Links

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.Links.html)

Renders all the [`<link>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link)
tags created by the route module's [`links`](../../start/framework/route-module#links)
export. You should render it inside the [`<head>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head)
of your document.

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

## Signature

```tsx
function Links({ nonce, crossOrigin }: LinksProps): React.JSX.Element
```

## Props

### nonce

A [`nonce`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce)
attribute to render on the [`<link>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link)
element

### crossOrigin

A [`crossOrigin`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin)
attribute to render on the [`<link>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link)
element

