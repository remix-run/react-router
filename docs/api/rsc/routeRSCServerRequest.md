---
title: routeRSCServerRequest
---

# routeRSCServerRequest

[MODES: data]

## Summary

Routes the incoming request to the RSC server and appropriately proxies the server response for data / resource requests, or renders to HTML for a document request.

## Options

### createFromReadableStream

Your `react-server-dom-xyz/client`'s `createFromReadableStream` function, used to decode payloads from the server.

### fetchServer

A function that forwards a `Request` to the RSC handler and returns a `Promise<Response>` containing a serialized `ServerPayload`.

### renderHTML

A function that renders the `ServerPayload` to HTML, usually using a `<RSCStaticRouter>`.

### request

The request to route.
