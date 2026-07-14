---
title: IsSessionFunction
---

# IsSessionFunction

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

[Reference Documentation ↗](https://api.reactrouter.com/v8/types/react-router.IsSessionFunction.html)

A function that determines whether a value is a React Router [`Session`](https://api.reactrouter.com/v8/interfaces/react-router.Session.html)
object.

## Signature

```tsx
type IsSessionFunction = (object: any) => object is Session;
```

## Params

### object

The value to check.

## Returns

`true` if the value is a React Router [`Session`](https://api.reactrouter.com/v8/interfaces/react-router.Session.html) object;
otherwise, `false`.

