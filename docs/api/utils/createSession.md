---
title: createSession
---

# createSession

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/server-runtime/sessions.ts
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.createSession.html)

Creates a new Session object.

Note: This function is typically not invoked directly by application code.
Instead, use a `SessionStorage` object's `getSession` method.

## Signature

```tsx
const createSession: CreateSessionFunction = <
  Data = SessionData,
  FlashData = Data,
>(
  initialData: Partial<Data> = {},
  id = "",
): Session<Data, FlashData>
```

## Params

### initialData

The initial data for the session.

### id

The identifier for the session. Defaults to an empty string for a new session.

## Returns

A new [`Session`](https://api.reactrouter.com/v8/interfaces/react-router.Session.html) object.
