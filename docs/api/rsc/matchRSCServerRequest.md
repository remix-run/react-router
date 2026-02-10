---
title: matchRSCServerRequest
unstable: true
---

# unstable_matchRSCServerRequest

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/rsc/server.rsc.ts
-->

[MODES: data]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in 
minor/patch releases. Please use with caution and pay **very** close attention 
to release notes for relevant changes.</docs-warning>

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/variables/react_router.unstable_matchRSCServerRequest.html)

Matches the given routes to a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
and returns an [RSC](https://react.dev/reference/rsc/server-components)
[`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
encoding an [`unstable_RSCPayload`](https://api.reactrouter.com/v7/types/react_router.unstable_RSCPayload.html) for consumption by an [RSC](https://react.dev/reference/rsc/server-components)
enabled client router.

```tsx
import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "@vitejs/plugin-rsc/rsc";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";

matchRSCServerRequest({
  createTemporaryReferenceSet,
  decodeAction,
  decodeFormState,
  decodeReply,
  loadServerAction,
  request,
  routes: routes(),
  generateResponse(match) {
    return new Response(
      renderToReadableStream(match.payload),
      {
        status: match.statusCode,
        headers: match.headers,
      }
    );
  },
});
```

## Signature

```tsx
async function matchRSCServerRequest({
  allowedActionOrigins,
  createTemporaryReferenceSet,
  basename,
  decodeReply,
  requestContext,
  loadServerAction,
  decodeAction,
  decodeFormState,
  onError,
  request,
  routes,
  generateResponse,
}: {
  allowedActionOrigins?: string[];
  createTemporaryReferenceSet: () => unknown;
  basename?: string;
  decodeReply?: DecodeReplyFunction;
  decodeAction?: DecodeActionFunction;
  decodeFormState?: DecodeFormStateFunction;
  requestContext?: RouterContextProvider;
  loadServerAction?: LoadServerActionFunction;
  onError?: (error: unknown) => void;
  request: Request;
  routes: RSCRouteConfigEntry[];
  generateResponse: (
    match: RSCMatch,
    {
      onError,
      temporaryReferences,
    }: {
      onError(error: unknown): string | undefined;
      temporaryReferences: unknown;
    },
  ) => Response;
}): Promise<Response>
```

## Params

### opts.allowedActionOrigins

Origin patterns that are allowed to execute actions.

### opts.basename

The basename to use when matching the request.

### opts.createTemporaryReferenceSet

A function that returns a temporary reference set for the request, used to track temporary references in the [RSC](https://react.dev/reference/rsc/server-components)
stream.

### opts.decodeAction

Your `react-server-dom-xyz/server`'s `decodeAction` function, responsible for loading a server action.

### opts.decodeFormState

A function responsible for decoding form state for progressively enhanceable forms with React's [`useActionState`](https://react.dev/reference/react/useActionState)
using your `react-server-dom-xyz/server`'s `decodeFormState`.

### opts.decodeReply

Your `react-server-dom-xyz/server`'s `decodeReply` function, used to decode the server function's arguments and bind them to the
implementation for invocation by the router.

### opts.generateResponse

A function responsible for using your `renderToReadableStream` to generate a [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
encoding the [`unstable_RSCPayload`](https://api.reactrouter.com/v7/types/react_router.unstable_RSCPayload.html).

### opts.loadServerAction

Your `react-server-dom-xyz/server`'s `loadServerAction` function, used to load a server action by ID.

### opts.onError

An optional error handler that will be called with any errors that occur during the request processing.

### opts.request

The [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) to match against.

### opts.requestContext

An instance of [`RouterContextProvider`](../utils/RouterContextProvider) that should be created per request, to be passed to [`action`](../../start/data/route-object#action)s,
[`loader`](../../start/data/route-object#loader)s and [middleware](../../how-to/middleware).

### opts.routes

Your [route definitions](https://api.reactrouter.com/v7/types/react_router.unstable_RSCRouteConfigEntry.html).

## Returns

A [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
that contains the [RSC](https://react.dev/reference/rsc/server-components)
data for hydration.

