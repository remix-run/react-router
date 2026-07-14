---
title: createRequestHandler
hidden: true
---

# createRequestHandler

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/server-runtime/server.ts
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/variables/react-router.createRequestHandler.html)

Creates a request handler for a React Router server build.

This is a low-level API used by server adapters to translate incoming
requests into React Router responses.

## Params

### build

The server build, or a function that resolves to the server build, used to handle requests.

### mode

The mode in which the server build is running.

## Returns

A request handler that returns a response for each incoming request.

