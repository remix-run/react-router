---
title: Security
---

# Security

This is by no means a comprehensive guide, but React Router provides features to help address a few aspects under the _very large_ umbrella that is _Security_.

## `Content-Security-Policy`

If you are implementing a [Content-Security-Policy (CSP)][csp] in your application, specifically one using the `unsafe-inline` directive, you will need to specify a [`nonce`][nonce] attribute on the inline `<script>` elements rendered in your HTML. This must be specified on any API that generates inline scripts, including:

- [`<Scripts nonce>`][scripts] (`root.tsx`)
- [`<ScrollRestoration nonce>`][scrollrestoration] (`root.tsx`)
- [`<ServerRouter nonce>`][serverrouter] (`entry.server.tsx`)
- [`renderToPipeableStream(..., { nonce })`][renderToPipeableStream] (`entry.server.tsx`)
- [`renderToReadableStream(..., { nonce })`][renderToReadableStream] (`entry.server.tsx`)

[csp]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
[nonce]: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce
[renderToPipeableStream]: https://react.dev/reference/react-dom/server/renderToPipeableStream
[renderToReadableStream]: https://react.dev/reference/react-dom/server/renderToReadableStream
[scripts]: ../api/components/Scripts
[scrollrestoration]: ../api/components/ScrollRestoration
[serverrouter]: ../api/components/ServerRouter
