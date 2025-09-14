---
title: RouterContextProvider
---

# RouterContextProvider

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/router/utils.ts
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/classes/react_router.RouterContextProvider.html)

Provides methods for writing/reading values in application context in a
type-safe way. Primarily for usage with [middleware](../../how-to/middleware).

```tsx
import {
  createContext,
  RouterContextProvider
} from "react-router";

const userContext = createContext<User | null>(null);
const contextProvider = new RouterContextProvider();
contextProvider.set(userContext, getUser());
//                               ^ Type-safe
const user = contextProvider.get(userContext);
//    ^ User
```

