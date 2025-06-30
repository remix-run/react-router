---
title: ScrollRestoration
---

# ScrollRestoration

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.ScrollRestoration.html)

Emulates the browser's scroll restoration on location changes. Apps should only render one of these, right before the [Scripts](../components/Scripts) component.

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

## Props

### ScriptsProps

[modes: framework, data]

A couple common attributes:

- `<Scripts crossOrigin>` for hosting your static assets on a different server than your app.
- `<Scripts nonce>` to support a [content security policy for scripts](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src) with [nonce-sources](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/Sources#sources) for your `<script>` tags.

You cannot pass through attributes such as `async`, `defer`, `src`, `type`, `noModule` because they are managed by React Router internally.
