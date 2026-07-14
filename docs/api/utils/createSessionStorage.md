---
title: createSessionStorage
hidden: true
---

# createSessionStorage

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/server-runtime/sessions.ts
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.createSessionStorage.html)

Creates a SessionStorage object using a SessionIdStorageStrategy.

Note: This is a low-level API that should only be used if none of the
existing session storage options meet your requirements.

## Signature

```tsx
function createSessionStorage<Data = SessionData, FlashData = Data>({
  cookie: cookieArg,
  createData,
  readData,
  updateData,
  deleteData,
}: SessionIdStorageStrategy<Data, FlashData>): SessionStorage<
  Data,
  FlashData
>
```

## Params

### strategy

The strategy used to store session identifiers and data.

## Returns

A [`SessionStorage`](https://api.reactrouter.com/v8/interfaces/react-router.SessionStorage.html) object that persists session data using the
provided strategy.

