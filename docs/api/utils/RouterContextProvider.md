---
title: RouterContextProvider
unstable: true
---

# unstable_RouterContextProvider

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/router/utils.ts
-->

[MODES: framework, data]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in 
minor/patch releases. Please use with caution and pay **very** close attention 
to release notes for relevant changes.</docs-warning>

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/classes/react_router.unstable_RouterContextProvider.html)

Provides methods for writing/reading values in application context in a
type-safe way. Primarily for usage with [middleware](../../how-to/middleware).

```tsx
import {
  unstable_createContext,
  unstable_RouterContextProvider
} from "react-router";

const userContext = unstable_createContext<User | null>(null);
const contextProvider = new unstable_RouterContextProvider();
contextProvider.set(userContext, getUser());
//                               ^ Type-safe
const user = contextProvider.get(userContext);
//    ^ User
```

