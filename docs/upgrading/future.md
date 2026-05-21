---
title: Future Flags
order: 1
---

# Future Flags and Deprecations

This guide walks you through the process of adopting future flags in your React Router app. By following this strategy, you will be able to upgrade to the next major version of React Router with minimal changes. To read more about future flags see [API Development Strategy][api-development-strategy].

We highly recommend you make a commit after each step and ship it instead of doing everything all at once. Most flags can be adopted in any order, with exceptions noted below.

## Update to latest v7.x

First update to the latest minor version of v7.x to have the latest future flags. You may see a number of deprecation warnings as you upgrade, which we'll cover below.

👉 Update to latest v7

```sh
npm install react-router@7 @react-router/{dev,node,etc.}@7
```

## `future.v8_splitRouteModules`

[MODES: framework]

<br/>
<br/>

**Background**

This feature enables splitting client-side route exports (`clientLoader`, `clientAction`, `clientMiddleware`, `HydrateFallback`) into separate chunks that can be loaded independently from the route component. This allows these exports to be fetched and executed while the component code is still downloading, improving performance for client-side data loading.

This can be set to `true` for opt-in behavior, or `"enforce"` to require all routes to be splittable (which will cause build failures for routes that cannot be split due to shared code).

👉 **Enable the Flag**

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    v8_splitRouteModules: true,
  },
} satisfies Config;
```

**Update your Code**

No code changes are required. This is an optimization feature that works automatically once enabled.

## Unstable Future Flags (Optional)

We document some [unstable] flags here as a reference for folks contributing to the project via beta testing, but they are not generally recommended for production use and may having breaking changes patch/minor releases - adopt with caution!

_No current unstable flags to document_

[api-development-strategy]: ../community/api-development-strategy
[unstable]: ../community/api-development-strategy#unstable-flags
[observability]: ../how-to/instrumentation
[vite-environment]: https://vite.dev/guide/api-environment
