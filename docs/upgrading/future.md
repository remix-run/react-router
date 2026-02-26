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

## `future.v8_viteEnvironmentApi`

[MODES: framework]

<br/>
<br/>

**Background**

This enables support for the experimental Vite Environment API, which provides a more flexible and powerful way to configure Vite environments. This is only available when using Vite 6+.

👉 **Enable the Flag**

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
```

**Update your Code**

No code changes are required unless you have custom Vite configuration that needs to be updated for the [Environment API][vite-environment]. Most users won't need to make any changes.

## Unstable Future Flags (Optional)

We document some [unstable] flags here as a reference for folks contributing to the project via beta testing, but they are not generally recommended for production use and may having breaking changes patch/minor releases - adopt with caution!

### future.unstable_passThroughRequests

[MODES: framework]

<br/>
<br/>

**Background**

By default, React Router normalizes the `request.url` passed to your `loader`, `action`, and `middleware` functions by removing React Router's internal implementation details. Specifically, it removes `.data` suffixes and internal search parameters like `?index` and `?_routes`.

This flag eliminates that normalization and passes the raw HTTP `request` instance to your handlers. This provides a few benefits:

- Reduces server-side overhead by eliminating multiple `new Request()` calls on the critical path
- Allows you to distinguish document from data requests in your handlers base don the presence of a `.data` suffix (useful for [observability] purposes)

If you were previously relying on the normalization of `request.url`, you can switch to use the new sibling `unstable_path` parameter which contains a `Path` object (`pathname`, `search`, `hash`) representing the normalized location.

👉 **Enable the Flag**

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    unstable_passThroughRequests: true,
  },
} satisfies Config;
```

**Update your Code**

If your code relies on inspecting the request URL, you should review it for any assumptions about the URL format:

```tsx
// ❌ Before: assuming no `.data` suffix in `request.url` pathname
export async function loader({
  request,
}: Route.LoaderArgs) {
  let url = new URL(request.url);
  if (url.pathname === "/path") {
    // This check might now behave differently because the request pathname will
    // contain the `.data` suffix on data requests
  }
}

// ✅ After: use `unstable_path` for normalized routing logic and `request.url`
// for raw routing logic
export async function loader({
  request,
  unstable_path,
}: Route.LoaderArgs) {
  if (unstable_path.pathname === "/path") {
    // This will always have the `.data` suffix stripped
  }

  // And now you can distinguish between document versus data requests
  let isDataRequest = new URL(
    request.url,
  ).pathname.endsWith(".data");
}
```

[api-development-strategy]: ../community/api-development-strategy
[unstable]: ../community/api-development-strategy#unstable-flags
[observability]: ../how-to/instrumentation
[Response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[vite-environment]: https://vite.dev/guide/api-environment
