---
title: Updating from v7
order: 2
---

# Upgrading from v7

We try our best to keep major version upgrades simple and boring through the use of opt-in APIs and [Future Flags][api-development-strategy]. Future flags are used to gate breaking changes that don't otherwise have a good call-site opt-in strategy. By adopting all opt-in APIs and future flags while still on v7, you should be able to update to React Router v8 with minimal changes.

We highly recommend you make a commit after each step and ship it instead of doing everything all at once. Most flags can be adopted in any order, with exceptions noted below.

## Minimum Versions

[MODES: framework, data, declarative]

<br/>
<br/>

React Router v8 requires the following minimum versions. Update them before updating React Router to v8:

- `node@22.22+`
- `react@19.2.7+`/`react-dom@19.2.7+`

Framework mode also requires:

- `vite@7+` (requires `future.v8_viteEnvironmentApi`)
  - also make sure any custom Vite plugins or config are compatible with Vite 7

## Update to latest v7.x

Before adopting any future flags or call-site opt-in changes, update to the latest minor version of v7.x to make sure you have access to the latest flags. You may see a number of deprecation warnings as you upgrade, which we'll cover below.

👉 Update to latest v7

```sh
npm install react-router@7 @react-router/{dev,node,etc.}@7
```

## Future Flags

### `future.v8_middleware`

[MODES: framework, data]

<br/>
<br/>

**Background**

Middleware allows you to run code before and after the [`Response`][Response] generation for the matched path. This enables common patterns like authentication, logging, error handling, and data preprocessing in a reusable way. Please see the [docs](../how-to/middleware) for more information.

👉 **Enable the Flag**

In Framework mode:

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    v8_middleware: true,
  },
} satisfies Config;
```

In Data mode:

```ts
import { createBrowserRouter } from "react-router";

const router = createBrowserRouter(routes, {
  future: {
    v8_middleware: true,
  },
});
```

**Update your Code**

If you're using the `context` parameter in `loader` and `action` functions, you may need to update your code:

- In Framework mode, if you're using `react-router-serve`, you should not need to make any updates. Otherwise, this only applies if you have a custom server with a `getLoadContext` function. Please see the docs on the middleware [`getLoadContext` changes](../how-to/middleware#changes-to-getloadcontextapploadcontext) and the instructions to [migrate to the new API](../how-to/middleware#migration-from-apploadcontext).
- In Data mode, add the `Future` module augmentation described in the [middleware docs](../how-to/middleware#1-typescript-augment-future-for-loaderaction-context) so `context` is typed correctly.

### `future.v8_splitRouteModules`

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

### `future.v8_viteEnvironmentApi`

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

Most users won't need to make any changes. However, if you have custom Vite configuration that previously relied on the `isSsrBuild` flag — such as a custom server build that sets `build.rollupOptions.input` — you'll need to move that configuration under the per-environment [Environment API][vite-environment] config instead.

For example, a custom server build should move its SSR `rollupOptions` from the top-level `build` config into `environments.ssr.build`:

```tsx diff filename=vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

-export default defineConfig(({ isSsrBuild }) => ({
-  build: {
-    rollupOptions: isSsrBuild
-      ? {
-          input: "./server/app.ts",
-        }
-      : undefined,
-  },
+export default defineConfig({
+  environments: {
+    ssr: {
+      build: {
+        rollupOptions: {
+          input: "./server/app.ts",
+        },
+      },
+    },
+  },
   plugins: [reactRouter()],
-}));
+});
```

See the [`node-custom-server` template][node-custom-server-template] for a complete example.

### `future.v8_passThroughRequests`

[MODES: framework]

<br/>
<br/>

**Background**

By default, React Router normalizes the `request.url` passed to your `loader`, `action`, and `middleware` functions by removing React Router's internal implementation details. Specifically, it removes `.data` suffixes and internal search parameters like `?index` and `?_routes`.

This flag eliminates that normalization and passes the raw HTTP `request` instance to your handlers. This provides a few benefits:

- Reduces server-side overhead by eliminating multiple `new Request()` calls on the critical path
- Allows you to distinguish document from data requests in your handlers based on the presence of a `.data` suffix (useful for [observability] purposes)

If you were previously relying on the normalization of `request.url`, you can switch to use the new sibling `url` parameter which contains a `URL` instance representing the normalized location.

👉 **Enable the Flag**

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    v8_passThroughRequests: true,
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

// ✅ After: use `url` for normalized routing logic and `request.url`
// for raw routing logic
export async function loader({
  request,
  url,
}: Route.LoaderArgs) {
  if (url.pathname === "/path") {
    // This will always have the `.data` suffix stripped
  }

  // And now you can distinguish between document versus data requests
  let isDataRequest = new URL(
    request.url,
  ).pathname.endsWith(".data");
}
```

### `future.v8_trailingSlashAwareDataRequests`

[MODES: framework]

<br/>
<br/>

**Background**

React Router serves Framework mode data requests from `.data` URLs. Previously, data requests for routes with and without trailing slashes could map to the same `.data` URL because trailing slashes were not considered during URL generation. This flag preserves trailing slash semantics for data request URLs to avoid ambiguity when your app distinguishes between trailing-slash and non-trailing-slash URLs.

In v7, your HTTP and `request` pathnames are as follows for `/a/b/c` and `/a/b/c/`

| URL `/a/b/c` | **HTTP pathname** | **`request` pathname`** |
| ------------ | ----------------- | ----------------------- |
| **Document** | `/a/b/c`          | `/a/b/c` ✅             |
| **Data**     | `/a/b/c.data`     | `/a/b/c` ✅             |

| URL `/a/b/c/` | **HTTP pathname** | **`request` pathname`** |
| ------------- | ----------------- | ----------------------- |
| **Document**  | `/a/b/c/`         | `/a/b/c/` ✅            |
| **Data**      | `/a/b/c.data`     | `/a/b/c` ⚠️             |

With this flag enabled, these pathnames are made consistent through a new `_.data` format for client-side `.data` requests:

| URL `/a/b/c` | **HTTP pathname** | **`request` pathname`** |
| ------------ | ----------------- | ----------------------- |
| **Document** | `/a/b/c`          | `/a/b/c` ✅             |
| **Data**     | `/a/b/c.data`     | `/a/b/c` ✅             |

| URL `/a/b/c/` | **HTTP pathname**  | **`request` pathname`** |
| ------------- | ------------------ | ----------------------- |
| **Document**  | `/a/b/c/`          | `/a/b/c/` ✅            |
| **Data**      | `/a/b/c/_.data` ⬅️ | `/a/b/c/` ✅            |

This flag also aligns the root data request to match this behavior by changing it from `/_root.data` to `/_.data`.

👉 **Enable the Flag**

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    v8_trailingSlashAwareDataRequests: true,
  },
} satisfies Config;
```

**Update your Code**

If you have custom app, CDN, cache, or rewrite logic that matches `.data` request URLs, update it to handle the new trailing-slash-aware `/_.data` format.

## Other Breaking Changes

The changes in this section are not controlled by future flags, but you can update your code while still on v7 before moving to v8.

### `meta`/`matches` `data` Values

[MODES: framework]

<br/>
<br/>

**Background**

React Router v8 removed deprecated `data` fields in favor of `loaderData` in a few places:

- `meta` function `data` argument
- `meta` function `matches` argument (`matches[i].data`)
- `useMatches()` (`matches[i].data`)

Use `loaderData` instead on `MetaArgs`, each item in `MetaArgs.matches`, and each match returned from `useMatches()`

👉 **Update your Code**

Replace `data` with `loaderData` in your `meta` functions:

```tsx diff
export function meta({
-  data,
+  loaderData,
  matches,
}: Route.MetaArgs) {
  return [
    {
-      title: data.title,
+      title: loaderData.title,
    },
  ];
}
```

If you read data from parent matches, update those references too:

```tsx diff
export function meta({ matches }: Route.MetaArgs) {
  let rootMatch = matches.find((match) => match.id === "root");
-  let rootData = rootMatch?.data;
+  let rootData = rootMatch?.loaderData;

  return [{ title: rootData?.siteTitle }];
}
```

Replace `data` with `loaderData` on `useMatches()` calls:

```tsx diff
export default function Component({ matches, loaderData }: ComponentProps) {
  let matches = useMatches();
- const rootLoaderData = matches[0].data;
+ const rootLoaderData = matches[0].loaderData;
  // ...
}
```

### `react-router-dom`

[MODES: framework, data, declarative]

<br/>
<br/>

**Background**

React Router v8 removes the `react-router-dom` re-export package. In v8, you should import DOM-specific APIs from `react-router/dom` and everything else from `react-router`.

👉 **Update your Code**

Uninstall `react-router-dom`:

```sh
npm uninstall react-router-dom
```

Replace `react-router-dom` imports with `react-router` imports:

```tsx diff
-import { Link, useLocation } from "react-router-dom";
+import { Link, useLocation } from "react-router";
```

For DOM-specific APIs, import from `react-router/dom`:

```tsx diff
-import { RouterProvider } from "react-router-dom";
+import { RouterProvider } from "react-router/dom";
```

### Cloudflare Vite Plugin

[MODES: framework]

<br/>
<br/>

**Background**

React Router v8 removes the React Router Cloudflare dev proxy. Cloudflare projects should use [`@cloudflare/vite-plugin`][cloudflare-vite-plugin] instead.

👉 **Update your Code**

Replace `cloudflareDevProxy` with `cloudflare`:

```tsx diff filename=vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
-import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
+import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
-    cloudflareDevProxy(),
+    cloudflare(),
    reactRouter(),
  ],
});
```

### `@react-router/architect` `useRequestContextDomainName`

[MODES: framework]

<br/>
<br/>

**Background**

In v7, the `@react-router/architect` adapter uses `X-Forwarded-Host` when creating the `request`, falling back to the `Host` header. In React Router v8, the adapter uses `event.requestContext.domainName` by default, falling back to the `Host` header.

👉 **Update your Code**

Opt in to the v8 behavior while still on v7 by passing `useRequestContextDomainName: true`:

```ts
import { createRequestHandler } from "@react-router/architect";
import * as build from "./build/server";

export const handler = createRequestHandler({
  build,
  useRequestContextDomainName: true,
});
```

This option is removed in v8 because the `event.requestContext.domainName` behavior is the default.

## Upgrade to v8

Now that your app is caught up, update to v8:

```shellscript nonumber
# data/declarative mode
npm install react-router@latest

# framework mode
npm install react-router@latest @react-router/{dev,node,etc.}@latest
```

Congratulations, you're now on v8!

[api-development-strategy]: ../community/api-development-strategy
[observability]: ../how-to/instrumentation
[Response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[vite-environment]: https://vite.dev/guide/api-environment
[node-custom-server-template]: https://github.com/remix-run/react-router-templates/blob/7c617a435510bc3add3a5395c07bc65328b65e9e/node-custom-server/vite.config.ts
[cloudflare-vite-plugin]: https://developers.cloudflare.com/workers/vite-plugin/
