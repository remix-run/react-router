---
title: matchRSCServerRequest
unstable: true
---

# matchRSCServerRequest

[MODES: data]

## Summary

Matches the given routes to a Request and returns a RSC Response encoding an `RSCPayload` for consumption by a RSC enabled client router.

## Options

### basename

The basename to use when matching the request.

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

### requestContext

A context value for the request to be passed to loaders and actions.

### routes

Your route definitions.
