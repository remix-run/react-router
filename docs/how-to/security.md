---
title: Security
---

# Security

[MODES: framework, data]

<br/>
<br/>

This is by no means a comprehensive guide, but React Router provides features to help address a few aspects under the _very large_ umbrella that is _Security_.

## `Content-Security-Policy`

### Framework Mode without RSC

If you are implementing a [Content-Security-Policy (CSP)][csp] in your application, specifically one using the `unsafe-inline` directive, you will need to specify a [`nonce`][nonce] attribute on the inline `<script>` elements rendered in your HTML.

Add a nonce to these two spots in [`entry.server.tsx`][entryserver]:

- The [`<ServerRouter nonce>`][serverrouter] prop
  - This will be proxied along through React Context and used for other Framework Mode components that output `nonce`-aware elements, including [`<Scripts>`][scripts], [`<ScrollRestoration>`][scrollrestoration]
  - If those components specify their own `nonce` prop, it will override the `ServerRouter` value
- The `nonce` options of [`renderToPipeableStream`][renderToPipeableStream]/[`renderToReadableStream`][renderToReadableStream]

### RSC Framework and RSC Data Mode

For RSC Framework and RSC Data Mode, generate the nonce in `entry.ssr.tsx` and pass it to `routeRSCServerRequest`, `RSCStaticRouter`, and the CSP response header. See the [RSC Content Security Policy nonce guide][rsc-csp]. The nonce is only needed while generating the HTML document; it should not be included in the RSC payload or passed to `matchRSCServerRequest`.

[csp]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
[entryserver]: ../api/framework-conventions/entry.server.tsx
[nonce]: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce
[renderToPipeableStream]: https://react.dev/reference/react-dom/server/renderToPipeableStream
[renderToReadableStream]: https://react.dev/reference/react-dom/server/renderToReadableStream
[scripts]: ../api/components/Scripts
[scrollrestoration]: ../api/components/ScrollRestoration
[serverrouter]: ../api/framework-routers/ServerRouter
[rsc-csp]: ./react-server-components#content-security-policy-nonces
