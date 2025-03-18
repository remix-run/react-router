---
title: Upgrading from Remix
order: 2
---

# Upgrading from Remix

<docs-info>

React Router v7 requires the following minimum versions:

- `node@20`
- `react@18`
- `react-dom@18`

</docs-info>

React Router v7 is the next major version of Remix after v2 (see our ["Incremental Path to React 19" blog post][incremental-path-to-react-19] for more information).

If you have enabled all [Remix v2 future flags][v2-future-flags], upgrading from Remix v2 to React Router v7 mainly involves updating dependencies.

<docs-info>

The majority of steps 2-8 can be automatically updated using a [codemod][codemod] created by community member [James Restall][jrestall].

</docs-info>

## 1. Adopt future flags

**👉 Adopt future flags**

Adopt all existing [future flags][v2-future-flags] in your Remix v2 application.

## 2. Update dependencies

Most of the "shared" APIs that used to be re-exported through the runtime-specific packages (`@remix-run/node`, `@remix-run/cloudflare`, etc.) have all been collapsed into `react-router` in v7. So instead of importing from `@react-router/node` or `@react-router/cloudflare`, you'll import those directly from `react-router`.

```diff
-import { redirect } from "@remix-run/node";
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

```shellscript nonumber
npm install
```

**👉 Update your dependencies (manual)**

If you prefer not to use the codemod, you can manually update your dependencies.

<details>
<summary>Expand to see a table of package name changes in alphabetical order</summary>

| Remix v2 Package                   |     | React Router v7 Package                     |
| ---------------------------------- | --- | ------------------------------------------- |
| `@remix-run/architect`             | ➡️  | `@react-router/architect`                   |
| `@remix-run/cloudflare`            | ➡️  | `@react-router/cloudflare`                  |
| `@remix-run/dev`                   | ➡️  | `@react-router/dev`                         |
| `@remix-run/express`               | ➡️  | `@react-router/express`                     |
| `@remix-run/fs-routes`             | ➡️  | `@react-router/fs-routes`                   |
| `@remix-run/node`                  | ➡️  | `@react-router/node`                        |
| `@remix-run/react`                 | ➡️  | `react-router`                              |
| `@remix-run/route-config`          | ➡️  | `@react-router/dev`                         |
| `@remix-run/routes-option-adapter` | ➡️  | `@react-router/remix-routes-option-adapter` |
| `@remix-run/serve`                 | ➡️  | `@react-router/serve`                       |
| `@remix-run/server-runtime`        | ➡️  | `react-router`                              |
| `@remix-run/testing`               | ➡️  | `react-router`                              |

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

If you used the codemod _and_ Remix v2 `v3_routeConfig` flag, you can skip this step as it was automatically completed.

</docs-info>

In React Router v7 you define your routes using the `app/routes.ts` file. View the [routing documentation][routing] for more information.

**👉 Update dependencies (if using Remix v2 `v3_routeConfig` flag)**

```diff
// app/routes.ts
-import { type RouteConfig } from "@remix-run/route-config";
-import { flatRoutes } from "@remix-run/fs-routes";
-import { remixRoutesOptionAdapter } from "@remix-run/routes-option-adapter";
+import { type RouteConfig } from "@react-router/dev/routes";
+import { flatRoutes } from "@react-router/fs-routes";
+import { remixRoutesOptionAdapter } from "@react-router/remix-routes-option-adapter";

export default [
  // however your routes are defined
] satisfies RouteConfig;

```

**👉 Add a `routes.ts` file (if _not_ using Remix v2 `v3_routeConfig` flag)**

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

Note: At this point you should remove the v3 future flags you added in step 1.

```shellscript nonumber
touch react-router.config.ts
```

```diff
// vite.config.ts
export default defineConfig({
  plugins: [
-   remix({
-     ssr: true,
-     future: {/* all the v3 flags */}
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

## 7. Enable type safety

<docs-info>

If you are not using TypeScript, you can skip this step.

</docs-info>

React Router automatically generates types for your route modules into a `.react-router/` directory at the root of your app. This directory is fully managed by React Router and should be gitignore'd. Learn more about the [new type safety features][type-safety].

**👉 Add `.react-router/` to `.gitignore`**

```txt
.react-router/
```

**👉 Update `tsconfig.json`**

Update the `types` field in your `tsconfig.json` to include:

- `.react-router/types/**/*` path in the `include` field
- The appropriate `@react-router/*` package in the `types` field
- `rootDirs` for simplified relative imports

```diff
{
  "include": [
    /* ... */
+   ".react-router/types/**/*"
  ],
  "compilerOptions": {
-   "types": ["@remix-run/node", "vite/client"],
+   "types": ["@react-router/node", "vite/client"],
    /* ... */
+   "rootDirs": [".", "./.react-router/types"]
  }
}
```

## 8. Rename components in entry files

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

## 9. Update types for `AppLoadContext`

<docs-info>

If you were using `remix-serve` you can skip this step. This is only applicable if you were using a custom server in Remix v2.

</docs-info>

Since React Router can be used as both a React framework _and_ a stand-alone routing library, the `context` argument for `LoaderFunctionArgs` and `ActionFunctionArgs` is now optional and typed as `any` by default. You can register types for your load context to get type safety for your loaders and actions.

👉 **Register types for your load context**

Before you migrate to the new `Route.LoaderArgs` and `Route.ActionArgs` types, you can temporarily augment `LoaderFunctionArgs` and `ActionFunctionArgs` with your load context type to ease migration.

```ts filename=app/env.ts
declare module "react-router" {
  // Your AppLoadContext used in v2
  interface AppLoadContext {
    whatever: string;
  }

  // TODO: remove this once we've migrated to `Route.LoaderArgs` instead for our loaders
  interface LoaderFunctionArgs {
    context: AppLoadContext;
  }

  // TODO: remove this once we've migrated to `Route.ActionArgs` instead for our actions
  interface ActionFunctionArgs {
    context: AppLoadContext;
  }
}

export {}; // necessary for TS to treat this as a module
```

<docs-info>

Using `declare module` to register types is a standard TypeScript technique called [module augmentation][ts-module-augmentation].
You can do this in any TypeScript file covered by your `tsconfig.json`'s `include` field, but we recommend a dedicated `env.ts` within your app directory.

</docs-info>

👉 **Use the new types**

Once you adopt the [new type generation][type-safety], you can remove the `LoaderFunctionArgs`/`ActionFunctionArgs` augmentations and use the `context` argument from [`Route.LoaderArgs`][server-loaders] and [`Route.ActionArgs`][server-actions] instead.

```ts filename=app/env.ts
declare module "react-router" {
  // Your AppLoadContext used in v2
  interface AppLoadContext {
    whatever: string;
  }
}

export {}; // necessary for TS to treat this as a module
```

```ts filename=app/routes/my-route.tsx
import type { Route } from "./+types/my-route";

export function loader({ context }: Route.LoaderArgs) {}
// { whatever: string }  ^^^^^^^

export function action({ context }: Route.ActionArgs) {}
// { whatever: string }  ^^^^^^^
```

Congratulations! You are now on React Router v7. Go ahead and run your application to make sure everything is working as expected.

[incremental-path-to-react-19]: https://remix.run/blog/incremental-path-to-react-19
[v2-future-flags]: https://remix.run/docs/start/future-flags
[routing]: ../start/framework/routing
[fs-routing]: ../how-to/file-route-conventions
[v7-changelog-types]: https://github.com/remix-run/react-router/blob/release-next/CHANGELOG.md#typesafety-improvements
[server-loaders]: ../start/framework/data-loading#server-data-loading
[server-actions]: ../start/framework/actions#server-actions
[ts-module-augmentation]: https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation
[type-safety]: ../explanation/type-safety
[codemod]: https://codemod.com/registry/remix-2-react-router-upgrade
[jrestall]: https://github.com/jrestall
