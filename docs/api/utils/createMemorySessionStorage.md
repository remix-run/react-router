---
title: createMemorySessionStorage
---

# createMemorySessionStorage

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/server-runtime/sessions/memoryStorage.ts
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.createMemorySessionStorage.html)

Creates and returns a simple in-memory SessionStorage object.

Intended for local development and testing. It does not scale beyond a single
process, and all session data is lost when the server process stops/restarts.

## Signature

```tsx
function createMemorySessionStorage<Data = SessionData, FlashData = Data>({
  cookie,
}: MemorySessionStorageOptions = {}): SessionStorage<Data, FlashData>
```

## Params

### options

Options for creating the in-memory session storage.

## Returns

A [`SessionStorage`](https://api.reactrouter.com/v8/interfaces/react-router.SessionStorage.html) object that stores session data in memory.

