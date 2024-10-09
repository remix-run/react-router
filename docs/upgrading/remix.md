---
title: Upgrading from Remix
hidden: true
---

# Upgrading from Remix

<docs-warning>This guide is still in development and is subject to change as React Router stabilizes prior to the `7.0.0` stable release</docs-warning>

Our intention is for the **Remix v2 -> React Router v7** upgrade path to be as non-breaking as possible via the use of [Future Flags][future-flags] and codemods for minor and straightforward code adjustments. To best prepare for this eventual upgrade, you can start by adopting all of the existing [Remix v2 Future Flags][v2-future-flags].

## Upgrading to the v7 Prerelease

If you want to attempt the (potentially rocky) migration now, the following steps should get you most of the way there. If you run into issues please let us know in [Discord][remix-discord] or [Github][github-new-issue].

### Step 1 - Adopt future flags

Adopt all existing [future flags][v2-future-flags] in your Remix v2 application.

### Step 2 - Update dependencies

You'll need to update your dependencies from the `@remix-run/*` packages to `react-router` and `@react-router/*` packages in `package.json` and in your code where you import from packages:

| Remix v2 Package            |     | React Router v7 Package    |
| --------------------------- | --- | -------------------------- |
| `@remix-run/architect`      | ➡️  | `@react-router/architect`  |
| `@remix-run/cloudflare`     | ➡️  | `@react-router/cloudflare` |
| `@remix-run/dev`            | ➡️  | `@react-router/dev`        |
| `@remix-run/express`        | ➡️  | `@react-router/express`    |
| `@remix-run/node`           | ➡️  | `@react-router/node`       |
| `@remix-run/react`          | ➡️  | `react-router`             |
| `@remix-run/serve`          | ➡️  | `@react-router/serve`      |
| `@remix-run/server-runtime` | ➡️  | `react-router`             |
| `@remix-run/testing`        | ➡️  | `react-router`             |

Most of the "shared" APIs that used to be re-exported through the runtime-specific packages (`@remix-run/node`, `@remix-run/cloudflare`, etc.) have all been collapsed into `react-router` in v7. So instead of importing from `@react-router/node` or `@react-router/cloudflare`, you'll import those directly from `react-router`.

```diff
-import { redirect } from "@react-router/node";
+import { redirect } from "react-router";
```

The only APIs should be importing from the runtime-specific packages in v7 are APIs that are specific to that runtime, such as `createFileSessionStorage` for Node and `createWorkersKVSessionStorage` for Cloudflare.

### Step 3 - Change `scripts` in `package.json`

Update the scripts in your `package.json`:

| Script      | Remix v2                            |     | React Router v7                            |
| ----------- | ----------------------------------- | --- | ------------------------------------------ |
| `dev`       | `remix vite:dev`                    | ➡️  | `react-router dev`                         |
| `build`     | `remix vite:build`                  | ➡️  | `react-router build`                       |
| `start`     | `remix-serve build/server/index.js` | ➡️  | `react-router-serve build/server/index.js` |
| `typecheck` | `tsc`                               | ➡️  | `react-router typegen && tsc`              |

### Step 4 - Rename plugin in `vite.config`

Update the import and rename the plugin in your `vite.config.ts`:

```diff
-import { vitePlugin as remix } from "@remix-run/dev";
+import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
-   remix({
-     future: {
-       // all future flags adopted
-     },
-   }),
+   reactRouter(),
    tsconfigPaths(),
  ],
});
```

### Step 5 - Add a `routes.ts` file

In React Router v7 you define your routes using the [`app/routes.ts`][routing] file. For backwards-compatibility and for folks who prefer [file-based conventions][fs-routing], you can opt-into the same "flat routes" convention you are using in Remix v2 as follows:

```ts filename=app/routes.ts
import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export const routes: RouteConfig = flatRoutes();
```

### Step 6 - Rename components in entry files

If you have an entry.server.tsx and/or an entry.client.tsx file in your application, you will need to rename the main components in this files:

| Entry File         | Remix v2 Component |     | React Router v7 Component |
| ------------------ | ------------------ | --- | ------------------------- |
| `entry.server.tsx` | `<RemixServer>`    | ➡️  | `<ServerRouter>`          |
| `entry.client.stx` | `<RemixBrowser>`   | ➡️  | `<HydratedRouter>`        |

## Known Prerelease Issues

### Typesafety

We have introduced some major changes to improve the type story in v7, but we're still working on making sure the path to adopt them is as smooth as possible prior to a stable v7 release. You can read more about the new type story in the [v7 draft release notes][v7-changelog-types] and if it's not a huge lift, your best bet for types in v7 is to migrate to that approach across the board.

For the time being we don't have a great story to _incrementally_ migrate data types to the v7 prerelease. We never brought the generics on data APIs (`useLoaderData`, `useFetcher`, `Await`, etc.) over from Remix to React Router because we knew that we could do better than what Remix v2 had, and we wanted to ensure that we didn't ship APIs in React Router just to yank them out. Now that we have a better idea of the type story in React outer v7, we're better able to see what the migration path look like and we plan on shipping improvements in this area in an upcoming v7 prerelease.

Currently, when you upgrade to React Router v7 you're going to get typescript yelling at you a bunch for these missing generics that existed in your Remix v2 app code. For now, you have 2 options to continue testing out the prerelease:

**Option 1 - Ignore the type errors with `@ts-expect-error` or `@ts-ignore`**

```diff
+// @ts-expect-error
let data = useLoaderData<typeof loader>();
```

**Option 2 - Remove the generics and optionally cast the types manually**

```diff
-let data = useLoaderData<typeof loader>();
+let data = useLoaderData() as ReturnType<Awaited<typeof loader>>;
```

[future-flags]: ../community/api-development-strategy
[v2-future-flags]: https://remix.run/docs/start/future-flags
[remix-discord]: https://rmx.as/discord
[github-new-issue]: https://github.com/remix-run/react-router/issues/new/choose
[routing]: ../start/routing
[fs-routing]: ../misc/file-route-conventions
[v7-changelog-types]: https://github.com/remix-run/react-router/blob/release-next/CHANGELOG.md#typesafety-improvements
