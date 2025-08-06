---
title: ScrollRestoration
---

# ScrollRestoration

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/lib.tsx
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.ScrollRestoration.html)

Emulates the browser's scroll restoration on location changes. Apps should only render one of these, right before the [`Scripts`](../components/Scripts) component.

```tsx
import { ScrollRestoration } from "react-router";

export default function Root() {
  return (
    <html>
      <body>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

This component renders an inline `<script>` to prevent scroll flashing. The `nonce` prop will be passed down to the script tag to allow CSP nonce usage.

```tsx
<ScrollRestoration nonce={cspNonce} />
```

## Signature

```tsx
function ScrollRestoration({
  getKey,
  storageKey,
  ...props
}: ScrollRestorationProps)
```

## Props

### getKey

A function that returns a key to use for scroll restoration. This is useful
for custom scroll restoration logic, such as using only the pathname so
that later navigations to prior paths will restore the scroll. Defaults to
`location.key`. See [`GetScrollRestorationKeyFunction`](https://api.reactrouter.com/v7/interfaces/react_router.GetScrollRestorationKeyFunction.html).

```tsx
<ScrollRestoration
  getKey={(location, matches) => {
    // Restore based on a unique location key (default behavior)
    return location.key

    // Restore based on pathname
    return location.pathname
  }}
/>
```

### nonce

A [`nonce`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce)
attribute to render on the [`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script)
element

### storageKey

The key to use for storing scroll positions in [`sessionStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage).
Defaults to `"react-router-scroll-positions"`.

