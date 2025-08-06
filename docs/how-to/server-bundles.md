---
title: Server Bundles
---

# Server Bundles

[MODES: framework]

<br/>
<br/>

<docs-warning>This is an advanced feature designed for hosting provider integrations. When compiling your app into multiple server bundles, there will need to be a custom routing layer in front of your app directing requests to the correct bundle.</docs-warning>

React Router typically builds your server code into a single bundle that exports a request handler function. However, there are scenarios where you might want to split your route tree into multiple server bundles, each exposing a request handler function for a subset of routes. To provide this flexibility, [`react-router.config.ts`][react-router-config] supports a `serverBundles` option, which is a function for assigning routes to different server bundles.

The [`serverBundles` function][server-bundles-function] is called for each route in the tree (except for routes that aren't addressable, e.g., pathless layout routes) and returns a server bundle ID that you'd like to assign that route to. These bundle IDs will be used as directory names in your server build directory.

For each route, this function receives an array of routes leading to and including that route, referred to as the route `branch`. This allows you to create server bundles for different portions of the route tree. For example, you could use this to create a separate server bundle containing all routes within a particular layout route:

```ts filename=react-router.config.ts lines=[5-13]
import type { Config } from "@react-router/dev/config";

export default {
  // ...
  serverBundles: ({ branch }) => {
    const isAuthenticatedRoute = branch.some((route) =>
      route.id.split("/").includes("_authenticated"),
    );

    return isAuthenticatedRoute
      ? "authenticated"
      : "unauthenticated";
  },
} satisfies Config;
```

Each `route` in the `branch` array contains the following properties:

- `id` — The unique ID for this route, named like its `file` but relative to the app directory and without the extension, e.g., `app/routes/gists.$username.tsx` will have an `id` of `routes/gists.$username`
- `path` — The path this route uses to match the URL pathname
- `file` — The absolute path to the entry point for this route
- `index` — Whether this route is an index route

## Build manifest

When the build is complete, React Router will call the `buildEnd` hook, passing a `buildManifest` object. This is useful if you need to inspect the build manifest to determine how to route requests to the correct server bundle.

```ts filename=react-router.config.ts lines=[5-7]
import type { Config } from "@react-router/dev/config";

export default {
  // ...
  buildEnd: async ({ buildManifest }) => {
    // ...
  },
} satisfies Config;
```

When using server bundles, the build manifest contains the following properties:

- `serverBundles` — An object that maps bundle IDs to the bundle's `id` and `file`
- `routeIdToServerBundleId` — An object that maps route IDs to their server bundle ID
- `routes` — A route manifest that maps route IDs to route metadata. This can be used to drive a custom routing layer in front of your React Router request handlers

[react-router-config]: https://api.reactrouter.com/v7/types/_react_router_dev.config.Config.html
[server-bundles-function]: https://api.reactrouter.com/v7/types/_react_router_dev.config.ServerBundlesFunction.html
