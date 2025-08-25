---
title: Future Flags
order: 1
---

# Future Flags and Deprecations

This guide walks you through the process of adopting future flags in your React Router app. By following this strategy, you will be able to upgrade to the next major version of React Router with minimal changes. To read more about future flags see [API Development Strategy](../community/api-development-strategy).

We highly recommend you make a commit after each step and ship it instead of doing everything all at once. Most flags can be adopted in any order, with exceptions noted below.

## Update to latest v7.x

First update to the latest minor version of v7.x to have the latest future flags. You may see a number of deprecation warnings as you upgrade, which we'll cover below.

👉 Update to latest v7

```sh
npm install react-router@7 @react-router/{dev,node,etc.}@7
```

## `future.v8_middleware`

[MODES: framework]

<br/>
<br/>

**Background**

Middleware allows you to run code before and after the [`Response`][Response] generation for the matched path. This enables common patterns like authentication, logging, error handling, and data preprocessing in a reusable way. Please see the [docs](../how-to/middleware) for more information.

👉 **Enable the Flag**

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    v8_middleware: true,
  },
} satisfies Config;
```

**Update your Code**

If you're using `react-router-serve`, then you should not need to make any updates to your code.

You should only need to update your code if you are using the `context` parameter in `loader` and `action` functions. This only applies if you have a custom server with a `getLoadContext` function. Please see the docs on the middleware [`getLoadContext` changes](../how-to/middleware#changes-to-getloadcontextapploadcontext) and the instructions to [migrate to the new API](../how-to/middleware#migration-from-apploadcontext).

[Response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
