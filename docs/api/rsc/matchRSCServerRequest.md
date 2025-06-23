---
title: matchRSCServerRequest
---

# matchRSCServerRequest

[MODES: data]

## Summary

Matches the given routes to a Request and returns a RSC Response encoding a `ServerPayload` for consumption by a RSC enabled client router.

## Options

### decodeCallServer

A function responsible for loading a server function, using your `react-server-dom-xyz/server`'s `decodeReply` to decode the server function's arguments, and bind them to the implementation for invocation by the router.

### decodeFormAction

A function responsible for loading a server action using your `react-server-dom-xyz/server`'s `decodeAction`.

### decodeFormState

A function responsible for decoding form state for progressively enhanceable forms with `useActionState` using your `react-server-dom-xyz/server`'s `decodeFormState`.

### generateResponse

A function responsible for using your `renderToReadableStream` to generate a Response encoding the `ServerPayload`.

### request

The request to match against.

### routes

Your route definitions.
