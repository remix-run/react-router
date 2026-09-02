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

## `Cross-Site Request Forgery`

React Router validates the origin of action submissions. When a request includes an `Origin` header, React Router first compares it with the origin of the request URL. Same-origin requests are accepted only when the **scheme, host, and port** all match. Cross-origin requests are accepted only when their **host** matches one of the patterns in [`allowedActionOrigins`][allowedactionorigins]. Rejected requests receive a `400` response and your `action` does not run. This check is enabled by default.

### Configuring allowed origins

Same-origin submissions are always allowed when the scheme, host, and port match exactly. [`allowedActionOrigins`][allowedactionorigins] specifies *additional* origins that you want to accept; it does not replace the same-origin check. By default, the list is empty, which means that only same-origin submissions are accepted.

Unlike the same-origin check, which compares the complete origin, entries in `allowedActionOrigins` are **host patterns**. They are matched only against the host of the `Origin` header; the scheme is not considered. Patterns use micromatch glob syntax: `*` matches one label and `**` matches multiple labels:

```ts filename=react-router.config.ts id="4ohbqp"
export default {
  allowedActionOrigins: [
    "example.com", // example.com
    "*.example.com", // sub.example.com
    "**.example.com", // sub.domain.example.com
  ],
} satisfies Config;
```

Because the port is part of the host, patterns are also matched against the port. For example, `example.com:8443` must be listed explicitly. The scheme is not part of the match, so listing `example.com` accepts submissions from both `http://example.com` and `https://example.com`.

A value of `["**"]` matches every host and effectively disables the origin check. Use this only if you have another mechanism protecting your actions.

The list can also be configured at runtime on the server build instead of in the config file.

### Methods that are checked

React Router checks `POST`, `PUT`, `PATCH`, and `DELETE` submissions. `GET` and `HEAD` requests are not checked.

This means that loaders do not receive this protection. For operations that mutate state, use an `action` rather than a `loader`.

### Cases that are not covered

* **Requests without an `Origin` header.** React Router only performs the origin check when the request includes an `Origin` header. Non-browser clients such as webhook senders and server-to-server callers commonly do not send one, so they are not blocked by this check. If such an endpoint relies on cookies or other ambient credentials, use additional authentication or CSRF protection as appropriate.

* **Direct requests to a resource route.** A [resource route][resource-routes] is a route module that exports a `loader` or `action` but does not have a default component or an `ErrorBoundary`. Resource routes are intended to expose endpoints that can be called by other origins, so direct requests to their actions are not subject to the origin check. Requests from your own application to a resource route through [`<Form>`][form] or [`useFetcher`][usefetcher] are still checked because they are handled as data requests. If a resource route changes state and authenticates its caller with a cookie, it needs its own CSRF protection.


[csp]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
[entryserver]: ../api/framework-conventions/entry.server.tsx
[nonce]: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce
[renderToPipeableStream]: https://react.dev/reference/react-dom/server/renderToPipeableStream
[renderToReadableStream]: https://react.dev/reference/react-dom/server/renderToReadableStream
[scripts]: ../api/components/Scripts
[scrollrestoration]: ../api/components/ScrollRestoration
[serverrouter]: ../api/framework-routers/ServerRouter
[rsc-csp]: ./react-server-components#content-security-policy-nonces
[allowedactionorigins]: ../api/framework-conventions/react-router.config.ts#allowedactionorigins
[form]: ../api/components/Form
[resource-routes]: ./resource-routes
[usefetcher]: ../api/hooks/useFetcher