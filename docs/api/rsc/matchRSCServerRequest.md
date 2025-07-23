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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.unstable_matchRSCServerRequest.html)

Matches the given routes to a Request and returns a RSC Response encoding an
`RSCPayload` for consumption by a RSC enabled client router.

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
      },
    );
  },
});
```

## Signature

```tsx
async function matchRSCServerRequest({
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
  createTemporaryReferenceSet: () => unknown;
  basename?: string;
  decodeReply?: DecodeReplyFunction;
  decodeAction?: DecodeActionFunction;
  decodeFormState?: DecodeFormStateFunction;
  requestContext?: unstable_RouterContextProvider;
  loadServerAction?: LoadServerActionFunction;
  onError?: (error: unknown) => void;
  request: Request;
  routes: RSCRouteConfigEntry[];
  generateResponse: (
    match: RSCMatch,
    {
      temporaryReferences,
    }: {
      temporaryReferences: unknown;
    },
  ) => Response;
}): Promise<Response>;
```

## Params

### opts.basename

The basename to use when matching the request.

### opts.decodeAction

Your `react-server-dom-xyz/server`'s `decodeAction` function, responsible for loading a server action.

### opts.decodeReply

Your `react-server-dom-xyz/server`'s `decodeReply` function, used to decode the server function's arguments and bind them to the
implementation for invocation by the router.

### opts.decodeFormState

A function responsible for decoding form state for progressively enhanceable forms with `useActionState` using your
`react-server-dom-xyz/server`'s `decodeFormState`.

### opts.generateResponse

A function responsible for using your `renderToReadableStream` to generate a Response encoding the `RSCPayload`.

### opts.loadServerAction

Your `react-server-dom-xyz/server`'s `loadServerAction` function, used to load a server action by ID.

### opts.request

The request to match against.

### opts.requestContext

An instance of `unstable_RouterContextProvider` that should be created per request, to be passed to loaders, actions and middleware.

### opts.routes

Your route definitions.

### opts.createTemporaryReferenceSet

A function that returns a temporary reference set for the request, used to track temporary references in the RSC stream.

### opts.onError

An optional error handler that will be called with any errors that occur during the request processing.

## Returns

A Response that contains the RSC data for hydration.
