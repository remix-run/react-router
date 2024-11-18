---
title: Upgrading from Remix
order: 2
---

# Upgrading from Remix

React Router v7 is the next major version of Remix after v2 (see our ["Incremental Path to React 19" blog post][incremental-path-to-react-19]) for more information).

The Remix v2 -> React Router v7 upgrade is simple and requires mostly updates to dependencies if you are caught up on all [Remix v2 future flags][v2-future-flags] (step 1).

<docs-info>

The majority of steps 2-8 can be automatically updated using a [codemod][codemod] created by community member [James Restall][jrestall].

</docs-info>

## 1. Adopt future flags

**👉 Adopt future flags**

Adopt all existing [future flags][v2-future-flags] in your Remix v2 application.

## 2. Update dependencies

Most of the "shared" APIs that used to be re-exported through the runtime-specific packages (`@remix-run/node`, `@remix-run/cloudflare`, etc.) have all been collapsed into `react-router` in v7. So instead of importing from `@react-router/node` or `@react-router/cloudflare`, you'll import those directly from `react-router`.

```diff
-import { redirect } from "@react-router/node";
+import { redirect } from "react-router";
```

The only APIs you should be importing from the runtime-specific packages in v7 are APIs that are specific to that runtime, such as `createFileSessionStorage` for Node and `createWorkersKVSessionStorage` for Cloudflare.

**👉 Run the codemod (automated)**

You can automatically update your packages and imports with the following [codemod][codemod]. This codemod updates all of your packages and imports. Be sure to commit any pending changes before running the codemod, in case you need to revert.

```shellscript nonumber
npx codemod remix/2/react-router/upgrade
```

**👉 Install the new dependencies**

After the codemod updates your dependencies, you need to install the dependencies to remove Remix packages and add the new React Router packages.

<docs-warning>

While still in prerelease, you need to update your `package.json` to point to the prerelease versions of the `react-router` packages.

</docs-warning>

```shellscript nonumber
npm install
```

**👉 Update your dependencies (manual)**

If you prefer not to use the codemod, you can manually update your dependencies.

<details>
<summary>Expand to see a table of package name changes in alphabetical order</summary>

| Remix v2 Package                   |     | React Router v7 Package                      |
| ---------------------------------- | --- | -------------------------------------------- |
| `@remix-run/architect`             | ➡️  | `@react-router/architect`                    |
| `@remix-run/cloudflare`            | ➡️  | `@react-router/cloudflare`                   |
| `@remix-run/dev`                   | ➡️  | `@react-router/dev`                          |
| `@remix-run/express`               | ➡️  | `@react-router/express`                      |
| `@remix-run/fs-routes`             | ➡️  | `@react-router/fs-routes`                    |
| `@remix-run/node`                  | ➡️  | `@react-router/node`                         |
| `@remix-run/react`                 | ➡️  | `react-router`                               |
| `@remix-run/route-config`          | ➡️  | `@react-router/dev`                          |
| `@remix-run/routes-option-adapter` | ➡️  | ` @react-router/remix-routes-option-adapter` |
| `@remix-run/serve`                 | ➡️  | `@react-router/serve`                        |
| `@remix-run/server-runtime`        | ➡️  | `react-router`                               |
| `@remix-run/testing`               | ➡️  | `react-router`                               |

</details>

## 3. Change `scripts` in `package.json`

<docs-info>

If you used the codemod you can skip this step as it was automatically completed.

</docs-info>

**👉 Update the scripts in your `package.json`**

| Script      | Remix v2                            |     | React Router v7                            |
| ----------- | ----------------------------------- | --- | ------------------------------------------ |
| `dev`       | `remix vite:dev`                    | ➡️  | `react-router dev`                         |
| `build`     | `remix vite:build`                  | ➡️  | `react-router build`                       |
| `start`     | `remix-serve build/server/index.js` | ➡️  | `react-router-serve build/server/index.js` |
| `typecheck` | `tsc`                               | ➡️  | `react-router typegen && tsc`              |

## 4. Add a `routes.ts` file

<docs-info>

If you used the codemod _and_ Remix v2 `unstable_routeConfig` flag, you can skip this step as it was automatically completed.

</docs-info>

In React Router v7 you define your routes using the `app/routes.ts` file. View the [routing documentation][routing] for more information.

**👉 Update dependencies (if using Remix v2 `unstable_routeConfig` flag)**

```diff
// app/routes.ts
-import { type RouteConfig } from "@remix-run/route-config";
-import { flatRoutes } from "@remix-run/fs-routes";
-import { remixRoutesOptionAdapter } from "@remix-run/routes-option-adapter";
+import { type RouteConfig } from "@react-router/dev/routes";
+import { flatRoutes } from "@react-router/fs-routes";
+import { remixRoutesOptionAdapter } from "@react-router/remix-routes-option-adapter";

export default {
  // however your routes are defined
} satisfies RouteConfig;

```

<!-- TODO: Remove this section once this flag is stabilized and recommend they make this change in Remix/refer to the routes.ts docs -->

**👉 Add a `routes.ts` file (if _not_ using Remix v2 `unstable_routeConfig` flag)**

```shellscript nonumber
touch app/routes.ts
```

For backwards-compatibility and for folks who prefer [file-based conventions][fs-routing], you can opt-into the same "flat routes" convention you are using in Remix v2 via the new `@react-router/fs-routes` package:

```ts filename=app/routes.ts
import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default flatRoutes() satisfies RouteConfig;
```

Or, if you were using the `routes` option to define config-based routes:

```ts filename=app/routes.ts
import { type RouteConfig } from "@react-router/dev/routes";
import { remixRoutesOptionAdapter } from "@react-router/remix-routes-option-adapter";

export default remixRoutesOptionAdapter((defineRoutes) => {
  return defineRoutes((route) => {
    route("/", "home/route.tsx", { index: true });
    route("about", "about/route.tsx");
    route("", "concerts/layout.tsx", () => {
      route("trending", "concerts/trending.tsx");
      route(":city", "concerts/city.tsx");
    });
  });
}) satisfies RouteConfig;
```

If you were using the `routes` option in your `vite.config.ts`, be sure to remove it.

```diff
export default defineConfig({
  plugins: [
    remix({
      ssr: true,
-     ignoredRouteFiles: ['**/*'],
-     routes(defineRoutes) {
-       return defineRoutes((route) => {
-         route("/somewhere/cool/*", "catchall.tsx");
-       });
-     },
    })
    tsconfigPaths(),
  ],
});
```

## 5. Add a React Router config

**👉 Add `react-router.config.ts` your project**

The config that was previously passed to the `remix` plugin in `vite.config.ts` is now exported from `react-router.config.ts`.

```shellscript nonumber
touch react-router.config.ts
```

```diff
// vite.config.ts
export default defineConfig({
  plugins: [
-   remix({
-     ssr: true,
-   }),
+   remix(),
    tsconfigPaths(),
  ],
});

// react-router.config.ts
+import type { Config } from "@react-router/dev/config";
+export default {
+  ssr: true,
+} satisfies Config;
```

## 6. Add React Router plugin to `vite.config`

<docs-info>

If you used the codemod you can skip this step as it was automatically completed.

</docs-info>

**👉 Add `reactRouter` plugin to `vite.config`**

Change `vite.config.ts` to import and use the new `reactRouter` plugin from `@react-router/dev/vite`:

```diff
-import { vitePlugin as remix } from "@remix-run/dev";
+import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
-   remix(),
+   reactRouter(),
    tsconfigPaths(),
  ],
});
```

## 7. Rename components in entry files

<docs-info>

If you used the codemod you can skip this step as it was automatically completed.

</docs-info>

If you have an `entry.server.tsx` and/or an `entry.client.tsx` file in your application, you will need to update the main components in these files:

```diff filename=app/entry.server.tsx
-import { RemixServer } from "@remix-run/react";
+import { ServerRouter } from "react-router";

-<RemixServer context={remixContext} url={request.url} />,
+<ServerRouter context={remixContext} url={request.url} />,
```

```diff filename=app/entry.client.tsx
-import { RemixBrowser } from "@remix-run/react";
+import { HydratedRouter } from "react-router/dom";

hydrateRoot(
  document,
  <StrictMode>
-   <RemixBrowser />
+   <HydratedRouter />
  </StrictMode>,
);
```

## 8. Update types for `AppLoadContext`

<docs-info>

If you were using `remix-serve` you can skip this step. This is only applicable if you were using a custom server in Remix v2.

Additionally, if you used the codemod you can skip this step as it was automatically completed.

</docs-info>

If you were using `getLoadContext` in your Remix app, then you'll notice that the `LoaderFunctionArgs`/`ActionFunctionArgs` types now type the `context` parameter incorrectly (optional and typed as `any`). These types accept a generic for the `context` type but even that still leaves the property as optional because it does not exist in React Router SPA apps.

The proper long term fix is to move to the new [`Route.LoaderArgs`][server-loaders]/[`Route.ActionArgs`][server-actions] types from the [new typegen in React Router v7][type-safety].

However, the short-term solution to ease the upgrade is to use TypeScript's [module augmentation][ts-module-augmentation] feature to override the built in `LoaderFunctionArgs`/`ActionFunctionArgs` interfaces.

You can do this with the following code in your `vite.config.ts`:

```ts filename=react-router.config.ts
// Your AppLoadContext used in v2
interface AppLoadContext {
  whatever: string;
}

// Tell v7 the type of the context and that it is non-optional
declare module "react-router" {
  interface LoaderFunctionArgs {
    context: AppLoadContext;
  }
}
```

This should allow you to upgrade and ship your application on React Router v7, and then you can incrementally migrate routes to the [new typegen approach][type-safety].

## Next steps

Congratulations! You are now on React Router v7. Go ahead and run your application to make sure everything is working as expected.

You may also want to check out some of the new features in React Router v7:

- [Type safety improvements][route-module-type-safety]
- [Route pre-rendering][route-pre-rendering]

[incremental-path-to-react-19]: https://remix.run/blog/incremental-path-to-react-19
[future-flags]: ../community/api-development-strategy
[v2-future-flags]: https://remix.run/docs/start/future-flags
[remix-discord]: https://rmx.as/discord
[github-new-issue]: https://github.com/remix-run/react-router/issues/new/choose
[routing]: ../start/framework/routing
[fs-routing]: ../how-to/file-route-conventions
[v7-changelog-types]: https://github.com/remix-run/react-router/blob/release-next/CHANGELOG.md#typesafety-improvements
[server-loaders]: ../start/framework/data-loading#server-data-loading
[server-actions]: ../start/framework/actions#server-actions
[ts-module-augmentation]: https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation
[type-safety]: ../explanation/type-safety
[codemod]: https://codemod.com/registry/remix-2-react-router-upgrade
[jrestall]: https://github.com/jrestall
[route-module-type-safety]: ../how-to/route-module-type-safety
[route-pre-rendering]: ../how-to/pre-rendering
