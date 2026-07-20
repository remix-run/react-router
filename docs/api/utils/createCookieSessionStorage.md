---
title: createCookieSessionStorage
---

# createCookieSessionStorage

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/server-runtime/sessions/cookieStorage.ts
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.createCookieSessionStorage.html)

Creates and returns a SessionStorage object that stores all session data
directly in the session cookie itself.

This has the advantage that no database or other backend services are
needed, and can help to simplify some load-balanced scenarios. However, it
also has the limitation that serialized session data may not exceed the
browser's maximum cookie size. Trade-offs!

## Signature

```tsx
function createCookieSessionStorage<Data = SessionData, FlashData = Data>({
  cookie: cookieArg,
}: CookieSessionStorageOptions = {}): SessionStorage<Data, FlashData>
```

## Params

### options

Options for creating the cookie-backed session storage.

## Returns

A [`SessionStorage`](https://api.reactrouter.com/v8/interfaces/react-router.SessionStorage.html) object that stores all session data in its
cookie.

