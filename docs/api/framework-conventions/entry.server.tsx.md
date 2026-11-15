---
title: entry.server.tsx
order: 5
---

# entry.server.tsx

[MODES: framework]

## Summary

This file is the server-side entry point that controls how your React Router application generates HTTP responses on the server.

This module should render the markup for the current page using a [`<ServerRouter>`][serverrouter] element with the `context` and `url` for the current request. This markup will (optionally) be re-hydrated once JavaScript loads in the browser using the [client entry module][client-entry].

<docs-info>This file is optional if you are running on Node. If it is not present, a [default implementation][node-streaming-entry-server] will be used.
<br/>
<br/>
If you are using another runtime (i.e., Cloudflare) then you need to include this file. You can find sample implementations in the [templates repository][templates-repo].</docs-info>

## Generating `entry.server.tsx`

When running in Node, React Router will handle generating the HTTP Response for you. You can reveal the default entry server file with the following:

```shellscript nonumber
npx react-router reveal
```

## Exports

### `default`

The `default` export of this module is a function that lets you create the response, including HTTP status, headers, and HTML, giving you full control over the way the markup is generated and sent to the client.

```tsx filename=app/entry.server.tsx
import { PassThrough } from "node:stream";
import type { EntryContext } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { renderToPipeableStream } from "react-dom/server";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter
        context={routerContext}
        url={request.url}
      />,
      {
        onShellReady() {
          responseHeaders.set("Content-Type", "text/html");

          const body = new PassThrough();
          const stream =
            createReadableStreamFromReadable(body);

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
      },
    );
  });
}
```

### `streamTimeout`

If you are [streaming] responses, you can export an optional `streamTimeout` value (in milliseconds) that will control the amount of time the server will wait for streamed promises to settle before rejecting outstanding promises and closing the stream.

It's recommended to decouple this value from the timeout in which you abort the React renderer. You should always set the React rendering timeout to a higher value so it has time to stream down the underlying rejections from your `streamTimeout`.

```tsx lines=[1-2,13-15]
// Reject all pending promises from handler functions after 10 seconds
export const streamTimeout = 10000;

export default function handleRequest(...) {
  return new Promise((resolve, reject) => {
    // ...

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      { /* ... */ }
    );

    // Abort the streaming render pass after 11 seconds to allow the rejected
    // boundaries to be flushed
    setTimeout(abort, streamTimeout + 1000);
  });
}
```

### `handleDataRequest`

You can export an optional `handleDataRequest` function that will allow you to modify the response of a data request. These are the requests that do not render HTML, but rather return the `loader` and `action` data to the browser once client-side hydration has occurred.

```tsx
export function handleDataRequest(
  response: Response,
  {
    request,
    params,
    context,
  }: LoaderFunctionArgs | ActionFunctionArgs,
) {
  response.headers.set("X-Custom-Header", "value");
  return response;
}
```

### `handleError`

By default, React Router will log encountered server-side errors to the console. If you'd like more control over the logging, or would like to also report these errors to an external service, then you can export an optional `handleError` function which will give you control (and will disable the built-in error logging).

```tsx
export function handleError(
  error: unknown,
  {
    request,
    params,
    context,
  }: LoaderFunctionArgs | ActionFunctionArgs,
) {
  if (!request.signal.aborted) {
    sendErrorToErrorReportingService(error);
    console.error(formatErrorForJsonLogging(error));
  }
}
```

_Note that you generally want to avoid logging when the request was aborted, since React Router's cancellation and race-condition handling can cause a lot of requests to be aborted._

**Streaming Rendering Errors**

When you are streaming your HTML responses via [`renderToPipeableStream`][rendertopipeablestream] or [`renderToReadableStream`][rendertoreadablestream], your own `handleError` implementation will only handle errors encountered during the initial shell render. If you encounter a rendering error during subsequent streamed rendering you will need to handle these errors manually since the React Router server has already sent the Response by that point.

For `renderToPipeableStream`, you can handle these errors in the `onError` callback function. You will need to toggle a boolean in `onShellReady` so you know if the error was a shell rendering error (and can be ignored) or an async

For an example, please refer to the default [`entry.server.tsx`][node-streaming-entry-server] for Node.

**Thrown Responses**

Note that this does not handle thrown `Response` instances from your `loader`/`action` functions. The intention of this handler is to find bugs in your code which result in unexpected thrown errors. If you are detecting a scenario and throwing a 401/404/etc. `Response` in your `loader`/`action` then it's an expected flow that is handled by your code. If you also wish to log, or send those to an external service, that should be done at the time you throw the response.

### `unstable_validateActionOrigin`

<docs-warning>`unstable_validateActionOrigin` is experimental and may change in minor or patch releases.</docs-warning>

Before React Router runs an `action` for a form submission or fetcher, it compares the request's `Origin` header with the origin of `request.url` and with [`allowedActionOrigins`][allowed-action-origins], and responds with `400 Bad Request` when neither matches. Like `allowedActionOrigins`, this does not apply to resource routes. You can export an optional `unstable_validateActionOrigin` function to make that decision yourself, for example when the allowed origins are only known at runtime.

The function receives the `request`, the raw `origin` header (`null` when it is absent) and `allowed`, the result of the built-in check. Return `true` to run the action; any other value rejects it. A malformed `Origin` header is rejected before your function is called, and an error thrown by your function rejects the submission and is passed to [`handleError`](#handleerror).

Don't read the request body in this function, the action still needs it. For submissions made after hydration (`<Form>`, `useSubmit` and fetchers), `request.url` is the route's `.data` URL.

```tsx
import type { unstable_ValidateActionOriginFunction } from "react-router";

export const unstable_validateActionOrigin: unstable_ValidateActionOriginFunction =
  async ({ origin, allowed }) => {
    if (allowed) return true;
    if (!origin || origin === "null") return false;
    // Like `allowedActionOrigins`, but loaded at runtime
    let trustedHosts = await getTrustedHosts();
    return trustedHosts.includes(new URL(origin).host);
  };
```

**Behind a TLS-terminating proxy**

When a reverse proxy terminates TLS, `request.url` uses `http:` while the browser sends an `https:` origin. If your hosts are known at build time, list them in [`allowedActionOrigins`][allowed-action-origins], which matches hosts regardless of the scheme. Otherwise, prefer configuring your server to trust the proxy, for example with Express's [`trust proxy`][express-trust-proxy] setting and `@react-router/express`, so `request.url` itself is correct. If your server can't be configured that way, you can accept the scheme the proxy reports:

```tsx
import type { unstable_ValidateActionOriginFunction } from "react-router";

export const unstable_validateActionOrigin: unstable_ValidateActionOriginFunction =
  ({ request, origin, allowed }) => {
    if (allowed) return true;
    if (!origin || origin === "null") return false;
    let originUrl = new URL(origin);
    let forwardedProto = request.headers
      .get("X-Forwarded-Proto")
      ?.split(",")[0]
      .trim();
    return (
      originUrl.host === new URL(request.url).host &&
      originUrl.protocol === `${forwardedProto}:`
    );
  };
```

<docs-warning>Only trust `X-Forwarded-*` headers when a proxy you control sets them and clients cannot reach your server directly.</docs-warning>

In RSC Framework Mode there is no `entry.server.tsx`: pass `unstable_validateActionOrigin` to [`matchRSCServerRequest`][match-rsc-server-request] in your `entry.rsc.tsx` instead.

[allowed-action-origins]: ./react-router.config.ts#allowedactionorigins
[express-trust-proxy]: https://expressjs.com/en/guide/behind-proxies.html
[match-rsc-server-request]: ../rsc/matchRSCServerRequest
[client-entry]: ./entry.client.tsx
[serverrouter]: ../framework-routers/ServerRouter
[streaming]: ../../how-to/suspense
[rendertopipeablestream]: https://react.dev/reference/react-dom/server/renderToPipeableStream
[rendertoreadablestream]: https://react.dev/reference/react-dom/server/renderToReadableStream
[node-streaming-entry-server]: https://github.com/remix-run/react-router/blob/main/packages/react-router-dev/config/defaults/entry.server.node.tsx
[templates-repo]: https://github.com/remix-run/react-router-templates
