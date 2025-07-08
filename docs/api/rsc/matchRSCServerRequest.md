---
title: matchRSCServerRequest
unstable: true
---

# matchRSCServerRequest

[MODES: data]

## Summary

Matches the given routes to a Request and returns a RSC Response encoding an `RSCPayload` for consumption by a RSC enabled client router.

The usage of this may differ slightly based on your bundler choice. Here's how it's used with Parcel via `react-server-dom-parcel/server.edge`:

```tsx filename=entry.rsc.ts lines=[10,17-33]
"use server-entry";

import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "react-server-dom-parcel/server.edge";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";

import { routes } from "./routes";

import "./entry.browser.tsx";

export function fetchServer(request: Request) {
  return matchRSCServerRequest({
    createTemporaryReferenceSet,
    decodeReply,
    decodeAction,
    loadServerAction,
    request,
    routes: routes(),
    generateResponse(match, options) {
      return new Response(
        renderToReadableStream(match.payload, options),
        {
          status: match.statusCode,
          headers: match.headers,
        }
      );
    },
  });
}
```

## Options

### decodeAction

Your `react-server-dom-xyz/server`'s `decodeAction` function, responsible for loading a server action.

### decodeReply

Your `react-server-dom-xyz/server`'s `decodeReply` function, used to decode the server function's arguments and bind them to the implementation for invocation by the router.

### decodeFormState

A function responsible for decoding form state for progressively enhanceable forms with `useActionState` using your `react-server-dom-xyz/server`'s `decodeFormState`.

### generateResponse

A function responsible for using your `renderToReadableStream` to generate a Response encoding the `RSCPayload`.

### loadServerAction

Your `react-server-dom-xyz/server`'s `loadServerAction` function, used to load a server action by ID.

### request

The request to match against.

### routes

Your route definitions.
