# `@react-router/dev`

## 7.5.2

### Patch Changes

- Adjust approach for Prerendering/SPA Mode via headers ([#13453](https://github.com/remix-run/react-router/pull/13453))
- Updated dependencies:
  - `react-router@7.5.2`
  - `@react-router/node@7.5.2`
  - `@react-router/serve@7.5.2`

## 7.5.1

### Patch Changes

- Fix prerendering when a loader returns a redirect ([#13365](https://github.com/remix-run/react-router/pull/13365))
- Updated dependencies:
  - `react-router@7.5.1`
  - `@react-router/node@7.5.1`
  - `@react-router/serve@7.5.1`

## 7.5.0

### Patch Changes

- Introduce `unstable_subResourceIntegrity` future flag that enables generation of an importmap with integrity for the scripts that will be loaded by the browser. ([#13163](https://github.com/remix-run/react-router/pull/13163))
- Update optional Wrangler peer dependency range to support Wrangler v4 ([#13258](https://github.com/remix-run/react-router/pull/13258))
- When `future.unstable_viteEnvironmentApi` is enabled, ensure critical CSS in development works when using a custom Vite `base` has been configured ([#13305](https://github.com/remix-run/react-router/pull/13305))
- Reinstate dependency optimization in the child compiler to fix `depsOptimizer is required in dev mode` errors when using `vite-plugin-cloudflare` and importing Node.js builtins ([#13317](https://github.com/remix-run/react-router/pull/13317))
- Updated dependencies:
  - `react-router@7.5.0`
  - `@react-router/node@7.5.0`
  - `@react-router/serve@7.5.0`

## 7.4.1

### Patch Changes

- Fix path in prerender error messages ([#13257](https://github.com/remix-run/react-router/pull/13257))
- Fix typegen for virtual modules when `moduleDetection` is set to `force` ([#13267](https://github.com/remix-run/react-router/pull/13267))
- When both `future.unstable_middleware` and `future.unstable_splitRouteModules` are enabled, split `unstable_clientMiddleware` route exports into separate chunks when possible ([#13210](https://github.com/remix-run/react-router/pull/13210))
- Improve performance of `future.unstable_middleware` by ensuring that route modules are only blocking during the middleware phase when the `unstable_clientMiddleware` has been defined ([#13210](https://github.com/remix-run/react-router/pull/13210))
- Updated dependencies:
  - `react-router@7.4.1`
  - `@react-router/node@7.4.1`
  - `@react-router/serve@7.4.1`

## 7.4.0

### Minor Changes

- Generate types for `virtual:react-router/server-build` module ([#13152](https://github.com/remix-run/react-router/pull/13152))

### Patch Changes

- When `future.unstable_splitRouteModules` is set to `"enforce"`, allow both splittable and unsplittable root route exports since it's always in a single chunk. ([#13238](https://github.com/remix-run/react-router/pull/13238))
- When `future.unstable_viteEnvironmentApi` is enabled, allow plugins that override the default SSR environment (such as `@cloudflare/vite-plugin`) to be placed before or after the React Router plugin. ([#13183](https://github.com/remix-run/react-router/pull/13183))
- Fix conflicts with other Vite plugins that use the `configureServer` and/or `configurePreviewServer` hooks ([#13184](https://github.com/remix-run/react-router/pull/13184))
- Updated dependencies:
  - `react-router@7.4.0`
  - `@react-router/node@7.4.0`
  - `@react-router/serve@7.4.0`

## 7.3.0

### Patch Changes

- Fix support for custom client `build.rollupOptions.output.entryFileNames` ([#13098](https://github.com/remix-run/react-router/pull/13098))

- Fix usage of `prerender` option when `serverBundles` option has been configured or provided by a preset, e.g. `vercelPreset` from `@vercel/react-router` ([#13082](https://github.com/remix-run/react-router/pull/13082))

- Fix support for custom `build.assetsDir` ([#13077](https://github.com/remix-run/react-router/pull/13077))

- Remove unused dependencies ([#13134](https://github.com/remix-run/react-router/pull/13134))

- Stub all routes except root in "SPA Mode" server builds to avoid issues when route modules or their dependencies import non-SSR-friendly modules ([#13023](https://github.com/remix-run/react-router/pull/13023))

- Fix errors with `future.unstable_viteEnvironmentApi` when the `ssr` environment has been configured by another plugin to be a custom `Vite.DevEnvironment` rather than the default `Vite.RunnableDevEnvironment` ([#13008](https://github.com/remix-run/react-router/pull/13008))

- Remove unused Vite file system watcher ([#13133](https://github.com/remix-run/react-router/pull/13133))

- Fix support for custom SSR build input when `serverBundles` option has been configured ([#13107](https://github.com/remix-run/react-router/pull/13107))

  Note that for consumers using the `future.unstable_viteEnvironmentApi` and `serverBundles` options together, hyphens are no longer supported in server bundle IDs since they also need to be valid Vite environment names.

- Fix dev server when using HTTPS by stripping HTTP/2 pseudo headers from dev server requests ([#12830](https://github.com/remix-run/react-router/pull/12830))

- Lazy load Cloudflare platform proxy on first dev server request when using the `cloudflareDevProxy` Vite plugin to avoid creating unnecessary workerd processes ([#13016](https://github.com/remix-run/react-router/pull/13016))

- When `future.unstable_viteEnvironmentApi` is enabled and the `ssr` environment has `optimizeDeps.noDiscovery` disabled, define `optimizeDeps.entries` and `optimizeDeps.include` ([#13007](https://github.com/remix-run/react-router/pull/13007))

- Fix duplicated entries in typegen for layout routes and their corresponding index route ([#13140](https://github.com/remix-run/react-router/pull/13140))

- Updated dependencies:
  - `react-router@7.3.0`
  - `@react-router/node@7.3.0`
  - `@react-router/serve@7.3.0`

## 7.2.0

### Minor Changes

- Generate a "SPA fallback" HTML file for scenarios where applications are prerendering the `/` route with `ssr:false` ([#12948](https://github.com/remix-run/react-router/pull/12948))

  - If you specify `ssr:false` without a `prerender` config, this is considered "SPA Mode" and the generated `index.html` file will only render down to the root route and will be able to hydrate for any valid application path
  - If you specify `ssr:false` with a `prerender` config but _do not_ include the `/` path (i.e., `prerender: ['/blog/post']`), then we still generate a "SPA Mode" `index.html` file that can hydrate for any path in the application
  - However, previously if you specified `ssr:false` and included the `/` path in your `prerender` config, we would prerender the `/` route into `index.html` as a non-SPA page
    - The generated HTML would include the root index route which prevented hydration for any other paths
    - With this change, we now generate a "SPA Mode" file in `__spa-fallback.html` that will allow you to hydrate for any non-prerendered paths
    - You can serve this file from your static file server for any paths that would otherwise 404 if you only want to pre-render _some_ routes in your `ssr:false` app and serve the others as a SPA
    - `npx sirv-cli build/client --single __spa-fallback.html`

- Allow a `loader` in the root route in SPA mode because it can be called/server-rendered at build time ([#12948](https://github.com/remix-run/react-router/pull/12948))

  - `Route.HydrateFallbackProps` now also receives `loaderData`
    - This will be defined so long as the `HydrateFallback` is rendering while _children_ routes are loading
    - This will be `undefined` if the `HydrateFallback` is rendering because the route has it's own hydrating `clientLoader`
    - In SPA mode, this will allow you to render loader root data into the SPA `index.html`

- New type-safe `href` utility that guarantees links point to actual paths in your app ([#13012](https://github.com/remix-run/react-router/pull/13012))

  ```tsx
  import { href } from "react-router";

  export default function Component() {
    const link = href("/blog/:slug", { slug: "my-first-post" });
    return (
      <main>
        <Link to={href("/products/:id", { id: "asdf" })} />
        <NavLink to={href("/:lang?/about", { lang: "en" })} />
      </main>
    );
  }
  ```

### Patch Changes

- Handle custom `envDir` in Vite config ([#12969](https://github.com/remix-run/react-router/pull/12969))

- Fix typegen for repeated params ([#13012](https://github.com/remix-run/react-router/pull/13012))

  In React Router, path parameters are keyed by their name.
  So for a path pattern like `/a/:id/b/:id?/c/:id`, the last `:id` will set the value for `id` in `useParams` and the `params` prop.
  For example, `/a/1/b/2/c/3` will result in the value `{ id: 3 }` at runtime.

  Previously, generated types for params incorrectly modeled repeated params with an array.
  So `/a/1/b/2/c/3` generated a type like `{ id: [1,2,3] }`.

  To be consistent with runtime behavior, the generated types now correctly model the "last one wins" semantics of path parameters.
  So `/a/1/b/2/c/3` now generates a type like `{ id: 3 }`.

- Fix CLI parsing to allow argumentless `npx react-router` usage ([#12925](https://github.com/remix-run/react-router/pull/12925))

- Fix `ArgError: unknown or unexpected option: --version` when running `react-router --version` ([#13012](https://github.com/remix-run/react-router/pull/13012))

- Skip action-only resource routes when using `prerender:true` ([#13004](https://github.com/remix-run/react-router/pull/13004))

- Enhance invalid export detection when using `ssr:false` ([#12948](https://github.com/remix-run/react-router/pull/12948))

  - `headers`/`action` are prohibited in all routes with `ssr:false` because there will be no runtime server on which to run them
  - `loader` functions are more nuanced and depend on whether a given route is prerendered
    - When using `ssr:false` without a `prerender` config, only the `root` route can have a `loader`
      - This is "SPA mode" which generates a single `index.html` file with the root route `HydrateFallback` so it is capable of hydrating for any path in your application - therefore we can only call a root route `loader` at build time
    - When using `ssr:false` with a `prerender` config, you can export a `loader` from routes matched by one of the `prerender` paths because those routes will be server rendered at build time
      - Exporting a `loader` from a route that is never matched by a `prerender` path will throw a build time error because there will be no runtime server to ever run the loader

- Limit prerendered resource route `.data` files to only the target route ([#13004](https://github.com/remix-run/react-router/pull/13004))

- Add unstable support for splitting route modules in framework mode via `future.unstable_splitRouteModules` ([#11871](https://github.com/remix-run/react-router/pull/11871))

- Fix prerendering of binary files ([#13039](https://github.com/remix-run/react-router/pull/13039))

- Add `future.unstable_viteEnvironmentApi` flag to enable experimental Vite Environment API support ([#12936](https://github.com/remix-run/react-router/pull/12936))

- Disable Lazy Route Discovery for all `ssr:false` apps and not just "SPA Mode" because there is no runtime server to serve the search-param-configured `__manifest` requests ([#12894](https://github.com/remix-run/react-router/pull/12894))

  - We previously only disabled this for "SPA Mode" which is `ssr:false` and no `prerender` config but we realized it should apply to all `ssr:false` apps, including those prerendering multiple pages
  - In those `prerender` scenarios we would prerender the `/__manifest` file assuming the static file server would serve it but that makes some unneccesary assumptions about the static file server behaviors

- Updated dependencies:
  - `react-router@7.2.0`
  - `@react-router/node@7.2.0`
  - `@react-router/serve@7.2.0`

## 7.1.5

### Patch Changes

- Updated dependencies:
  - `react-router@7.1.5`
  - `@react-router/node@7.1.5`
  - `@react-router/serve@7.1.5`

## 7.1.4

### Patch Changes

- Properly resolve Windows file paths to scan for Vite's dependency optimization when using the `unstable_optimizeDeps` future flag. ([#12637](https://github.com/remix-run/react-router/pull/12637))
- Fix prerendering when using a custom server - previously we ended up trying to import the users custom server when we actually want to import the virtual server build module ([#12759](https://github.com/remix-run/react-router/pull/12759))
- Updated dependencies:
  - `react-router@7.1.4`
  - `@react-router/node@7.1.4`
  - `@react-router/serve@7.1.4`

## 7.1.3

### Patch Changes

- Fix `reveal` and `routes` CLI commands ([#12745](https://github.com/remix-run/react-router/pull/12745))
- Updated dependencies:
  - `react-router@7.1.3`
  - `@react-router/node@7.1.3`
  - `@react-router/serve@7.1.3`

## 7.1.2

### Patch Changes

- Fix default external conditions in Vite v6. This fixes resolution issues with certain npm packages. ([#12644](https://github.com/remix-run/react-router/pull/12644))
- Fix mismatch in prerendering html/data files when path is missing a leading slash ([#12684](https://github.com/remix-run/react-router/pull/12684))
- Use `module-sync` server condition when enabled in the runtime. This fixes React context mismatches (e.g. `useHref() may be used only in the context of a <Router> component.`) during development on Node 22.10.0+ when using libraries that have a peer dependency on React Router. ([#12729](https://github.com/remix-run/react-router/pull/12729))
- Fix react-refresh source maps ([#12686](https://github.com/remix-run/react-router/pull/12686))
- Updated dependencies:
  - `react-router@7.1.2`
  - `@react-router/node@7.1.2`
  - `@react-router/serve@7.1.2`

## 7.1.1

### Patch Changes

- Fix for a crash when optional args are passed to the CLI ([`5b1ca202f`](https://github.com/remix-run/react-router/commit/5b1ca202f77ef342db0109c6b791d33188077cd0))
- Updated dependencies:
  - `react-router@7.1.1`
  - `@react-router/node@7.1.1`
  - `@react-router/serve@7.1.1`

## 7.1.0

### Minor Changes

- Add support for Vite v6 ([#12469](https://github.com/remix-run/react-router/pull/12469))

### Patch Changes

- Properly initialize `NODE_ENV` if not already set for compatibility with React 19 ([#12578](https://github.com/remix-run/react-router/pull/12578))

- Remove the leftover/unused `abortDelay` prop from `ServerRouter` and update the default `entry.server.tsx` to use the new `streamTimeout` value for Single Fetch ([#12478](https://github.com/remix-run/react-router/pull/12478))

  - The `abortDelay` functionality was removed in v7 as it was coupled to the `defer` implementation from Remix v2, but this removal of this prop was missed
  - If you were still using this prop in your `entry.server` file, it's likely your app is not aborting streams as you would expect and you will need to adopt the new [`streamTimeout`](https://reactrouter.com/explanation/special-files#streamtimeout) value introduced with Single Fetch

- Updated dependencies:
  - `react-router@7.1.0`
  - `@react-router/node@7.1.0`
  - `@react-router/serve@7.1.0`

## 7.0.2

### Patch Changes

- Support `moduleResolution` `Node16` and `NodeNext` ([#12440](https://github.com/remix-run/react-router/pull/12440))

- Generate wide `matches` and `params` types for current route and child routes ([#12397](https://github.com/remix-run/react-router/pull/12397))

  At runtime, `matches` includes child route matches and `params` include child route path parameters.
  But previously, we only generated types for parent routes in `matches`; for `params`, we only considered the parent routes and the current route.
  To align our generated types more closely to the runtime behavior, we now generate more permissive, wider types when accessing child route information.

- Updated dependencies:
  - `react-router@7.0.2`
  - `@react-router/node@7.0.2`
  - `@react-router/serve@7.0.2`

## 7.0.1

### Patch Changes

- Pass route error to ErrorBoundary as a prop ([#12338](https://github.com/remix-run/react-router/pull/12338))
- Ensure typegen file watcher is cleaned up when Vite dev server restarts ([#12331](https://github.com/remix-run/react-router/pull/12331))
- Updated dependencies:
  - `react-router@7.0.1`
  - `@react-router/node@7.0.1`
  - `@react-router/serve@7.0.1`

## 7.0.0

### Major Changes

- For Remix consumers migrating to React Router, the `vitePlugin` and `cloudflareDevProxyVitePlugin` exports have been renamed and moved. ([#11904](https://github.com/remix-run/react-router/pull/11904))

  ```diff
  -import {
  -  vitePlugin as remix,
  -  cloudflareDevProxyVitePlugin,
  -} from "@remix/dev";

  +import { reactRouter } from "@react-router/dev/vite";
  +import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
  ```

- Remove single fetch future flag. ([#11522](https://github.com/remix-run/react-router/pull/11522))

- update minimum node version to 18 ([#11690](https://github.com/remix-run/react-router/pull/11690))

- Add `exports` field to all packages ([#11675](https://github.com/remix-run/react-router/pull/11675))

- node package no longer re-exports from react-router ([#11702](https://github.com/remix-run/react-router/pull/11702))

- For Remix consumers migrating to React Router who used the Vite plugin's `buildEnd` hook, the resolved `reactRouterConfig` object no longer contains a `publicPath` property since this belongs to Vite, not React Router. ([#11575](https://github.com/remix-run/react-router/pull/11575))

- For Remix consumers migrating to React Router, the Vite plugin's `manifest` option has been removed. ([#11573](https://github.com/remix-run/react-router/pull/11573))

  The `manifest` option been superseded by the more powerful `buildEnd` hook since it's passed the `buildManifest` argument. You can still write the build manifest to disk if needed, but you'll most likely find it more convenient to write any logic depending on the build manifest within the `buildEnd` hook itself.

  If you were using the `manifest` option, you can replace it with a `buildEnd` hook that writes the manifest to disk like this:

  ```ts
  // react-router.config.ts
  import type { Config } from "@react-router/dev/config";
  import { writeFile } from "node:fs/promises";

  export default {
    async buildEnd({ buildManifest }) {
      await writeFile(
        "build/manifest.json",
        JSON.stringify(buildManifest, null, 2),
        "utf-8"
      );
    },
  } satisfies Config;
  ```

- Consolidate types previously duplicated across `@remix-run/router`, `@remix-run/server-runtime`, and `@remix-run/react` now that they all live in `react-router` ([#12177](https://github.com/remix-run/react-router/pull/12177))

  - Examples: `LoaderFunction`, `LoaderFunctionArgs`, `ActionFunction`, `ActionFunctionArgs`, `DataFunctionArgs`, `RouteManifest`, `LinksFunction`, `Route`, `EntryRoute`
  - The `RouteManifest` type used by the "remix" code is now slightly stricter because it is using the former `@remix-run/router` `RouteManifest`
    - `Record<string, Route> -> Record<string, Route | undefined>`
  - Removed `AppData` type in favor of inlining `unknown` in the few locations it was used
  - Removed `ServerRuntimeMeta*` types in favor of the `Meta*` types they were duplicated from

- Update default `isbot` version to v5 and drop support for `isbot@3` ([#11770](https://github.com/remix-run/react-router/pull/11770))

  - If you have `isbot@4` or `isbot@5` in your `package.json`:
    - You do not need to make any changes
  - If you have `isbot@3` in your `package.json` and you have your own `entry.server.tsx` file in your repo
    - You do not need to make any changes
    - You can upgrade to `isbot@5` independent of the React Router v7 upgrade
  - If you have `isbot@3` in your `package.json` and you do not have your own `entry.server.tsx` file in your repo
    - You are using the internal default entry provided by React Router v7 and you will need to upgrade to `isbot@5` in your `package.json`

- Drop support for Node 18, update minimum Node vestion to 20 ([#12171](https://github.com/remix-run/react-router/pull/12171))

  - Remove `installGlobals()` as this should no longer be necessary

- For Remix consumers migrating to React Router, Vite manifests (i.e. `.vite/manifest.json`) are now written within each build subdirectory, e.g. `build/client/.vite/manifest.json` and `build/server/.vite/manifest.json` instead of `build/.vite/client-manifest.json` and `build/.vite/server-manifest.json`. This means that the build output is now much closer to what you'd expect from a typical Vite project. ([#11573](https://github.com/remix-run/react-router/pull/11573))

  Originally the Remix Vite plugin moved all Vite manifests to a root-level `build/.vite` directory to avoid accidentally serving them in production, particularly from the client build. This was later improved with additional logic that deleted these Vite manifest files at the end of the build process unless Vite's `build.manifest` had been enabled within the app's Vite config. This greatly reduced the risk of accidentally serving the Vite manifests in production since they're only present when explicitly asked for. As a result, we can now assume that consumers will know that they need to manage these additional files themselves, and React Router can safely generate a more standard Vite build output.

### Minor Changes

- Params, loader data, and action data as props for route component exports ([#11961](https://github.com/remix-run/react-router/pull/11961))

  ```tsx
  export default function Component({ params, loaderData, actionData }) {}

  export function HydrateFallback({ params }) {}
  export function ErrorBoundary({ params, loaderData, actionData }) {}
  ```

- Remove internal entry.server.spa.tsx implementation ([#11681](https://github.com/remix-run/react-router/pull/11681))

- Add `prefix` route config helper to `@react-router/dev/routes` ([#12094](https://github.com/remix-run/react-router/pull/12094))

- ### Typesafety improvements ([#12019](https://github.com/remix-run/react-router/pull/12019))

  React Router now generates types for each of your route modules.
  You can access those types by importing them from `./+types.<route filename without extension>`.
  For example:

  ```ts
  // app/routes/product.tsx
  import type * as Route from "./+types.product";

  export function loader({ params }: Route.LoaderArgs) {}

  export default function Component({ loaderData }: Route.ComponentProps) {}
  ```

  This initial implementation targets type inference for:

  - `Params` : Path parameters from your routing config in `routes.ts` including file-based routing
  - `LoaderData` : Loader data from `loader` and/or `clientLoader` within your route module
  - `ActionData` : Action data from `action` and/or `clientAction` within your route module

  In the future, we plan to add types for the rest of the route module exports: `meta`, `links`, `headers`, `shouldRevalidate`, etc.
  We also plan to generate types for typesafe `Link`s:

  ```tsx
  <Link to="/products/:id" params={{ id: 1 }} />
  //        ^^^^^^^^^^^^^          ^^^^^^^^^
  // typesafe `to` and `params` based on the available routes in your app
  ```

  Check out our docs for more:

  - [_Explanations > Type Safety_](https://reactrouter.com/dev/guides/explanation/type-safety)
  - [_How-To > Setting up type safety_](https://reactrouter.com/dev/guides/how-to/setting-up-type-safety)

### Patch Changes

- Enable prerendering for resource routes ([#12200](https://github.com/remix-run/react-router/pull/12200))
- chore: warn instead of error for min node version in CLI ([#12270](https://github.com/remix-run/react-router/pull/12270))
- chore: re-enable development warnings through a `development` exports condition. ([#12269](https://github.com/remix-run/react-router/pull/12269))
- include root "react-dom" module for optimization ([#12060](https://github.com/remix-run/react-router/pull/12060))
- resolve config directory relative to flat output file structure ([#12187](https://github.com/remix-run/react-router/pull/12187))
- if we are in SAP mode, always render the `index.html` for hydration ([#12268](https://github.com/remix-run/react-router/pull/12268))
- fix(react-router): (v7) fix static prerender of non-ascii characters ([#12161](https://github.com/remix-run/react-router/pull/12161))
- Updated dependencies:
  - `react-router@7.0.0`
  - `@react-router/serve@7.0.0`
  - `@react-router/node@7.0.0`

## 2.9.0

### Minor Changes

- New `future.unstable_singleFetch` flag ([#8773](https://github.com/remix-run/remix/pull/8773))

  - Naked objects returned from loaders/actions are no longer automatically converted to JSON responses. They'll be streamed as-is via `turbo-stream` so `Date`'s will become `Date` through `useLoaderData()`
  - You can return naked objects with `Promise`'s without needing to use `defer()` - including nested `Promise`'s
    - If you need to return a custom status code or custom response headers, you can still use the `defer` utility
  - `<RemixServer abortDelay>` is no longer used. Instead, you should `export const streamTimeout` from `entry.server.tsx` and the remix server runtime will use that as the delay to abort the streamed response
    - If you export your own streamTimeout, you should decouple that from aborting the react `renderToPipeableStream`. You should always ensure that react is aborted _afer_ the stream is aborted so that abort rejections can be flushed down
  - Actions no longer automatically revalidate on 4xx/5xx responses (via RR `future.unstable_skipActionErrorRevalidation` flag) - you can return a 2xx to opt-into revalidation or use `shouldRevalidate`

### Patch Changes

- Improve `getDependenciesToBundle` resolution in monorepos ([#8848](https://github.com/remix-run/remix/pull/8848))
- Fix SPA mode when single fetch is enabled by using streaming entry.server ([#9063](https://github.com/remix-run/remix/pull/9063))
- Vite: added sourcemap support for transformed routes ([#8970](https://github.com/remix-run/remix/pull/8970))
- Update links printed to the console by the Remix CLI/Dev Server to point to updated docs locations ([#9176](https://github.com/remix-run/remix/pull/9176))
- Updated dependencies:
  - `@remix-run/node@2.9.0`
  - `@remix-run/server-runtime@2.9.0`

## 2.8.1

### Patch Changes

- Support reading from Vite config when running `remix reveal` and `remix routes` CLI commands ([#8916](https://github.com/remix-run/remix/pull/8916))
- Add Vite commands to Remix CLI `--help` output ([#8939](https://github.com/remix-run/remix/pull/8939))
- Vite: Fix support for `build.sourcemap` option in Vite config ([#8965](https://github.com/remix-run/remix/pull/8965))
- Clean up redundant client route query strings on route JavaScript files in production builds ([#8969](https://github.com/remix-run/remix/pull/8969))
- Vite: Fix error when using Vite's `server.fs.allow` option without a client entry file ([#8966](https://github.com/remix-run/remix/pull/8966))
- Updated dependencies:
  - `@remix-run/node@2.8.1`
  - `@remix-run/server-runtime@2.8.1`

## 2.8.0

### Minor Changes

- Pass resolved `viteConfig` to Remix Vite plugin's `buildEnd` hook ([#8885](https://github.com/remix-run/remix/pull/8885))

### Patch Changes

- Mark `Layout` as browser safe route export in `esbuild` compiler ([#8842](https://github.com/remix-run/remix/pull/8842))
- Vite: Silence build warnings when dependencies include "use client" directives ([#8897](https://github.com/remix-run/remix/pull/8897))
- Vite: Fix `serverBundles` issue where multiple browser manifests are generated ([#8864](https://github.com/remix-run/remix/pull/8864))
- Support custom Vite `build.assetsDir` option ([#8843](https://github.com/remix-run/remix/pull/8843))
- Updated dependencies:
  - `@remix-run/node@2.8.0`
  - `@remix-run/server-runtime@2.8.0`

## 2.7.2

### Patch Changes

- Vite: Fix error when building projects with `.css?url` imports ([#8829](https://github.com/remix-run/remix/pull/8829))
- Updated dependencies:
  - `@remix-run/node@2.7.2`
  - `@remix-run/server-runtime@2.7.2`

## 2.7.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@2.7.1`
  - `@remix-run/server-runtime@2.7.1`

## 2.7.0

### Minor Changes

- Allow an optional `Layout` export from the root route ([#8709](https://github.com/remix-run/remix/pull/8709))

- Vite: Cloudflare Proxy as a Vite plugin ([#8749](https://github.com/remix-run/remix/pull/8749))

  **This is a breaking change for projects relying on Cloudflare support from the unstable Vite plugin**

  The Cloudflare preset (`unstable_cloudflarePreset`) as been removed and replaced with a new Vite plugin:

  ```diff
   import {
      unstable_vitePlugin as remix,
  -   unstable_cloudflarePreset as cloudflare,
  +   cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
    } from "@remix-run/dev";
    import { defineConfig } from "vite";

    export default defineConfig({
      plugins: [
  +     remixCloudflareDevProxy(),
  +     remix(),
  -     remix({
  -       presets: [cloudflare()],
  -     }),
      ],
  -   ssr: {
  -     resolve: {
  -       externalConditions: ["workerd", "worker"],
  -     },
  -   },
    });
  ```

  `remixCloudflareDevProxy` must come _before_ the `remix` plugin so that it can override Vite's dev server middleware to be compatible with Cloudflare's proxied environment.

  Because it is a Vite plugin, `remixCloudflareDevProxy` can set `ssr.resolve.externalConditions` to be `workerd`-compatible for you.

  `remixCloudflareDevProxy` accepts a `getLoadContext` function that replaces the old `getRemixDevLoadContext`.
  If you were using a `nightly` version that required `getBindingsProxy` or `getPlatformProxy`, that is no longer required.
  Any options you were passing to `getBindingsProxy` or `getPlatformProxy` should now be passed to `remixCloudflareDevProxy` instead.

  This API also better aligns with future plans to support Cloudflare with a framework-agnostic Vite plugin that makes use of Vite's (experimental) Runtime API.

- Vite: Stabilize the Remix Vite plugin, Cloudflare preset, and all related types by removing all `unstable_` / `Unstable_` prefixes. ([#8713](https://github.com/remix-run/remix/pull/8713))

  While this is a breaking change for existing Remix Vite plugin consumers, now that the plugin has stabilized, there will no longer be any breaking changes outside of a major release. Thank you to all of our early adopters and community contributors for helping us get here! 🙏

- Vite: Stabilize "SPA Mode" by renaming the Remix vite plugin config from `unstable_ssr -> ssr` ([#8692](https://github.com/remix-run/remix/pull/8692))

- Vite: Add a new `basename` option to the Vite plugin, allowing users to set the internal React Router [`basename`](https://reactrouter.com/en/main/routers/create-browser-router#basename) in order to to serve their applications underneath a subpath ([#8145](https://github.com/remix-run/remix/pull/8145))

### Patch Changes

- Vite: fix server exports dead-code elimination for routes outside of app directory ([#8795](https://github.com/remix-run/remix/pull/8795))

- Always prepend DOCTYPE in SPA mode entry.server.tsx, can opt out via remix reveal ([#8725](https://github.com/remix-run/remix/pull/8725))

- Fix build issue in SPA mode when using a `basename` ([#8720](https://github.com/remix-run/remix/pull/8720))

- Vite: Validate that the MDX Rollup plugin, if present, is placed before Remix in Vite config ([#8690](https://github.com/remix-run/remix/pull/8690))

- Vite: reliably detect non-root routes in Windows ([#8806](https://github.com/remix-run/remix/pull/8806))

  Sometimes route `file` will be unnormalized Windows path with `\` instead of `/`.

- Vite: Pass `remixUserConfig` to preset `remixConfig` hook ([#8797](https://github.com/remix-run/remix/pull/8797))

- Vite: Fix issue resolving critical CSS during development when the current working directory differs from the project root ([#8752](https://github.com/remix-run/remix/pull/8752))

- Vite: Ensure CSS file URLs that are only referenced in the server build are available on the client ([#8796](https://github.com/remix-run/remix/pull/8796))

- Vite: Require version 5.1.0 to support `.css?url` imports ([#8723](https://github.com/remix-run/remix/pull/8723))

- Fix type error in Remix config for synchronous `routes` function ([#8745](https://github.com/remix-run/remix/pull/8745))

- Vite: Support Vite v5.1.0's `.css?url` imports ([#8684](https://github.com/remix-run/remix/pull/8684))

- Always ignore route files starting with `.` ([#8801](https://github.com/remix-run/remix/pull/8801))

- Vite: Enable use of [`vite preview`](https://main.vitejs.dev/guide/static-deploy.html#deploying-a-static-site) to preview Remix SPA applications ([#8624](https://github.com/remix-run/remix/pull/8624))

  - In the SPA template, `npm run start` has been renamed to `npm run preview` which uses `vite preview` instead of a standalone HTTP server such as `http-server` or `serv-cli`

- Vite: Remove the ability to pass `publicPath` as an option to the Remix vite plugin ([#8145](https://github.com/remix-run/remix/pull/8145))

  - ⚠️ **This is a breaking change for projects using the unstable Vite plugin with a `publicPath`**
  - This is already handled in Vite via the [`base`](https://vitejs.dev/guide/build.html#public-base-path) config so we now set the Remix `publicPath` from the Vite `base` config

- Vite: Fix issue where client route file requests fail if search params have been parsed and serialized before reaching the Remix Vite plugin ([#8740](https://github.com/remix-run/remix/pull/8740))

- Vite: Enable HMR for .md and .mdx files ([#8711](https://github.com/remix-run/remix/pull/8711))

- Updated dependencies:
  - `@remix-run/server-runtime@2.7.0`
  - `@remix-run/node@2.7.0`

## 2.6.0

### Minor Changes

- Add `future.v3_throwAbortReason` flag to throw `request.signal.reason` when a request is aborted instead of an `Error` such as `new Error("query() call aborted: GET /path")` ([#8251](https://github.com/remix-run/remix/pull/8251))

### Patch Changes

- Vite: Add `manifest` option to Vite plugin to enable writing a `.remix/manifest.json` file to the build directory ([#8575](https://github.com/remix-run/remix/pull/8575))

  **This is a breaking change for consumers of the Vite plugin's "server bundles" feature.**

  The `build/server/bundles.json` file has been superseded by the more general `build/.remix/manifest.json`. While the old server bundles manifest was always written to disk when generating server bundles, the build manifest file must be explicitly enabled via the `manifest` option.

- Vite: Provide `Unstable_ServerBundlesFunction` and `Unstable_VitePluginConfig` types ([#8654](https://github.com/remix-run/remix/pull/8654))

- Vite: add `--sourcemapClient` and `--sourcemapServer` flags to `remix vite:build` ([#8613](https://github.com/remix-run/remix/pull/8613))

  - `--sourcemapClient`

  - `--sourcemapClient=inline`

  - `--sourcemapClient=hidden`

  - `--sourcemapServer`

  - `--sourcemapServer=inline`

  - `--sourcemapServer=hidden`

  See <https://vitejs.dev/config/build-options.html#build-sourcemap>

- Vite: Validate IDs returned from the `serverBundles` function to ensure they only contain alphanumeric characters, hyphens and underscores ([#8598](https://github.com/remix-run/remix/pull/8598))

- Vite: fix "could not fast refresh" false alarm ([#8580](https://github.com/remix-run/remix/pull/8580))

  HMR is already functioning correctly but was incorrectly logging that it "could not fast refresh" on internal client routes.
  Now internal client routes correctly register Remix exports like `meta` for fast refresh,
  which removes the false alarm.

- Vite: Cloudflare Pages support ([#8531](https://github.com/remix-run/remix/pull/8531))

  To get started with Cloudflare, you can use the \[`unstable-vite-cloudflare`]\[template-vite-cloudflare] template:

  ```shellscript nonumber
  npx create-remix@latest --template remix-run/remix/templates/unstable-vite-cloudflare
  ```

  Or read the new docs at [Future > Vite > Cloudflare](https://remix.run/docs/en/main/future/vite#cloudflare) and
  [Future > Vite > Migrating > Migrating Cloudflare Functions](https://remix.run/docs/en/main/future/vite#migrating-cloudflare-functions).

- Vite: Remove undocumented backwards compatibility layer for Vite v4 ([#8581](https://github.com/remix-run/remix/pull/8581))

- Vite: rely on Vite plugin ordering ([#8627](https://github.com/remix-run/remix/pull/8627))

  **This is a breaking change for projects using the unstable Vite plugin.**

  The Remix plugin expects to process JavaScript or TypeScript files, so any transpilation from other languages must be done first.
  For example, that means putting the MDX plugin _before_ the Remix plugin:

  ```diff
    import mdx from "@mdx-js/rollup";
    import { unstable_vitePlugin as remix } from "@remix-run/dev";
    import { defineConfig } from "vite";

    export default defineConfig({
      plugins: [
  +     mdx(),
        remix()
  -     mdx(),
      ],
    });
  ```

  Previously, the Remix plugin misused `enforce: "post"` from Vite's plugin API to ensure that it ran last.
  However, this caused other unforeseen issues.
  Instead, we now rely on standard Vite semantics for plugin ordering.

  The official [Vite React SWC plugin](https://github.com/vitejs/vite-plugin-react-swc/blob/main/src/index.ts#L97-L116) also relies on plugin ordering for MDX.

- Vite: Add `presets` option to ease integration with different platforms and tools. ([#8514](https://github.com/remix-run/remix/pull/8514))

- Vite: Remove interop with `<LiveReload />`, rely on `<Scripts />` instead ([#8636](https://github.com/remix-run/remix/pull/8636))

  **This is a breaking change for projects using the unstable Vite plugin.**

  Vite provides a robust client-side runtime for development features like HMR,
  making the `<LiveReload />` component obsolete.

  In fact, having a separate dev scripts component was causing issues with script execution order.
  To work around this, the Remix Vite plugin used to override `<LiveReload />` into a bespoke
  implementation that was compatible with Vite.

  Instead of all this indirection, now the Remix Vite plugin instructs the `<Scripts />` component
  to automatically include Vite's client-side runtime and other dev-only scripts.

  ```diff
    import {
  -   LiveReload,
      Outlet,
      Scripts,
    }

    export default function App() {
      return (
        <html>
          <head>
          </head>
          <body>
            <Outlet />
            <Scripts />
  -         <LiveReload />
          </body>
        </html>
      )
    }
  ```

- Vite: Add `buildEnd` hook ([#8620](https://github.com/remix-run/remix/pull/8620))

- Vite: add dev load context option to Cloudflare preset ([#8649](https://github.com/remix-run/remix/pull/8649))

- Vite: Add `mode` field into generated server build ([#8539](https://github.com/remix-run/remix/pull/8539))

- Vite: Only write Vite manifest files if `build.manifest` is enabled within the Vite config ([#8599](https://github.com/remix-run/remix/pull/8599))

  **This is a breaking change for consumers of Vite's `manifest.json` files.**

  To explicitly enable generation of Vite manifest files, you must set `build.manifest` to `true` in your Vite config.

  ```ts
  export default defineConfig({
    build: { manifest: true },
    // ...
  });
  ```

- Vite: reduce network calls for route modules during HMR ([#8591](https://github.com/remix-run/remix/pull/8591))

- Vite: Add new `buildDirectory` option with a default value of `"build"`. This replaces the old `assetsBuildDirectory` and `serverBuildDirectory` options which defaulted to `"build/client"` and `"build/server"` respectively. ([#8575](https://github.com/remix-run/remix/pull/8575))

  **This is a breaking change for consumers of the Vite plugin that were using the `assetsBuildDirectory` and `serverBuildDirectory` options.**

  The Remix Vite plugin now builds into a single directory containing `client` and `server` directories. If you've customized your build output directories, you'll need to migrate to the new `buildDirectory` option, e.g.

  ```diff
  import { unstable_vitePlugin as remix } from "@remix-run/dev";
  import { defineConfig } from "vite";

  export default defineConfig({
    plugins: [
      remix({
  -      serverBuildDirectory: "dist/server",
  -      assetsBuildDirectory: "dist/client",
  +      buildDirectory: "dist",
      })
    ],
  });
  ```

- Vite: Remove `unstable` prefix from `serverBundles` option. ([#8596](https://github.com/remix-run/remix/pull/8596))

- Vite: Write Vite manifest files to `build/.vite` directory rather than being nested within `build/client` and `build/server` directories. ([#8599](https://github.com/remix-run/remix/pull/8599))

  **This is a breaking change for consumers of Vite's `manifest.json` files.**

  Vite manifest files are now written to the Remix build directory. Since all Vite manifests are now in the same directory, they're no longer named `manifest.json`. Instead, they're named `build/.vite/client-manifest.json` and `build/.vite/server-manifest.json`, or `build/.vite/server-{BUNDLE_ID}-manifest.json` when using server bundles.

- Updated dependencies:
  - `@remix-run/server-runtime@2.6.0`
  - `@remix-run/node@2.6.0`

## 2.5.1

### Patch Changes

- Add `isSpaMode` to `@remix-run/dev/server-build` virtual module ([#8492](https://github.com/remix-run/remix/pull/8492))
- Automatically prepend `<!DOCTYPE html>` if not present to fix quirks mode warnings for SPA template ([#8495](https://github.com/remix-run/remix/pull/8495))
- Vite: Errors for server-only code point to new docs ([#8488](https://github.com/remix-run/remix/pull/8488))
- Vite: Fix HMR race condition when reading changed file contents ([#8479](https://github.com/remix-run/remix/pull/8479))
- Vite: Tree-shake unused route exports in the client build ([#8468](https://github.com/remix-run/remix/pull/8468))
- Vite: Performance profiling ([#8493](https://github.com/remix-run/remix/pull/8493))
  - Run `remix vite:build --profile` to generate a `.cpuprofile` that can be shared or uploaded to speedscope.app
  - In dev, press `p + enter` to start a new profiling session or stop the current session
  - If you need to profile dev server startup, run `remix vite:dev --profile` to initialize the dev server with a running profiling session
  - For more, see the new docs: Vite > Performance
- Vite: Improve performance of dev server requests by invalidating Remix's virtual modules on relevant file changes rather than on every request ([#8164](https://github.com/remix-run/remix/pull/8164))
- Updated dependencies:
  - `@remix-run/node@2.5.1`
  - `@remix-run/server-runtime@2.5.1`

## 2.5.0

### Minor Changes

- Add unstable support for "SPA Mode" ([#8457](https://github.com/remix-run/remix/pull/8457))

  You can opt into SPA Mode by setting `unstable_ssr: false` in your Remix Vite plugin config:

  ```js
  // vite.config.ts
  import { unstable_vitePlugin as remix } from "@remix-run/dev";
  import { defineConfig } from "vite";

  export default defineConfig({
    plugins: [remix({ unstable_ssr: false })],
  });
  ```

  Development in SPA Mode is just like a normal Remix app, and still uses the Remix dev server for HMR/HDR:

  ```sh
  remix vite:dev
  ```

  Building in SPA Mode will generate an `index.html` file in your client assets directory:

  ```sh
  remix vite:build
  ```

  To run your SPA, you serve your client assets directory via an HTTP server:

  ```sh
  npx http-server build/client
  ```

  For more information, please refer to the [SPA Mode docs](https://remix.run/future/spa-mode).

- Add `unstable_serverBundles` option to Vite plugin to support splitting server code into multiple request handlers. ([#8332](https://github.com/remix-run/remix/pull/8332))

  This is an advanced feature designed for hosting provider integrations. When compiling your app into multiple server bundles, there will need to be a custom routing layer in front of your app directing requests to the correct bundle. This feature is currently unstable and only designed to gather early feedback.

  **Example usage:**

  ```ts
  import { unstable_vitePlugin as remix } from "@remix-run/dev";
  import { defineConfig } from "vite";

  export default defineConfig({
    plugins: [
      remix({
        unstable_serverBundles: ({ branch }) => {
          const isAuthenticatedRoute = branch.some(
            (route) => route.id === "routes/_authenticated"
          );

          return isAuthenticatedRoute ? "authenticated" : "unauthenticated";
        },
      }),
    ],
  });
  ```

### Patch Changes

- Fix issue with `isbot` v4 released on 1/1/2024 ([#8415](https://github.com/remix-run/remix/pull/8415))

  - `remix dev` will now add `"isbot": "^4"` to `package.json` instead of using `latest`
  - Update built-in `entry.server` files to work with both `isbot@3` and `isbot@4` for backwards-compatibility with Remix apps that have pinned `isbot` to v3
  - Templates are updated to use `isbot@4` moving forward via `create-remix`

- Vite: Fix HMR issues when altering exports for non-rendered routes ([#8157](https://github.com/remix-run/remix/pull/8157))

- Vite: Default `NODE_ENV` to `"production"` when running `remix vite:build` command ([#8405](https://github.com/remix-run/remix/pull/8405))

- Vite: Remove Vite plugin config option `serverBuildPath` in favor of separate `serverBuildDirectory` and `serverBuildFile` options ([#8332](https://github.com/remix-run/remix/pull/8332))

- Vite: Loosen strict route exports restriction, reinstating support for non-Remix route exports ([#8420](https://github.com/remix-run/remix/pull/8420))

- Updated dependencies:
  - `@remix-run/server-runtime@2.5.0`
  - `@remix-run/node@2.5.0`

## 2.4.1

### Patch Changes

- Vite: Error messages when `.server` files are referenced by client ([#8267](https://github.com/remix-run/remix/pull/8267))

  - Previously, referencing a `.server` module from client code resulted in an error message like:
    - `The requested module '/app/models/answer.server.ts' does not provide an export named 'isDateType'`
  - This was confusing because `answer.server.ts` _does_ provide the `isDateType` export, but Remix was replacing `.server` modules with empty modules (`export {}`) for the client build
  - Now, Remix explicitly fails at compile time when a `.server` module is referenced from client code and includes dedicated error messages depending on whether the import occurs in a route or a non-route module
  - The error messages also include links to relevant documentation

- Remove `unstable_viteServerBuildModuleId` in favor of manually referencing virtual module name `"virtual:remix/server-build"`. ([#8264](https://github.com/remix-run/remix/pull/8264))

  **This is a breaking change for projects using the unstable Vite plugin with a custom server.**

  This change was made to avoid issues where `@remix-run/dev` could be inadvertently required in your server's production dependencies.

  Instead, you should manually write the virtual module name `"virtual:remix/server-build"` when calling `ssrLoadModule` in development.

  ```diff
  -import { unstable_viteServerBuildModuleId } from "@remix-run/dev";

  // ...

  app.all(
    "*",
    createRequestHandler({
      build: vite
  -      ? () => vite.ssrLoadModule(unstable_viteServerBuildModuleId)
  +      ? () => vite.ssrLoadModule("virtual:remix/server-build")
        : await import("./build/server/index.js"),
    })
  );
  ```

- Vite: Fix errors for non-existent `index.html` importer ([#8353](https://github.com/remix-run/remix/pull/8353))

- Add `vite:dev` and `vite:build` commands to the Remix CLI. ([#8211](https://github.com/remix-run/remix/pull/8211))

  In order to handle upcoming Remix features where your plugin options can impact the number of Vite builds required, you should now run your Vite `dev` and `build` processes via the Remix CLI.

  ```diff
  {
    "scripts": {
  -    "dev": "vite dev",
  -    "build": "vite build && vite build --ssr"
  +    "dev": "remix vite:dev",
  +    "build": "remix vite:build"
    }
  }
  ```

- Vite: Preserve names for exports from `.client` modules ([#8200](https://github.com/remix-run/remix/pull/8200))

  Unlike `.server` modules, the main idea is not to prevent code from leaking into the server build
  since the client build is already public. Rather, the goal is to isolate the SSR render from client-only code.
  Routes need to import code from `.client` modules without compilation failing and then rely on runtime checks
  or otherwise ensure that execution only happens within a client-only context (e.g. event handlers, `useEffect`).

  Replacing `.client` modules with empty modules would cause the build to fail as ESM named imports are statically analyzed.
  So instead, we preserve the named export but replace each exported value with `undefined`.
  That way, the import is valid at build time and standard runtime checks can be used to determine if the
  code is running on the server or client.

- Disable watch mode in Vite child compiler during build ([#8342](https://github.com/remix-run/remix/pull/8342))

- Vite: Show warning when source maps are enabled in production build ([#8222](https://github.com/remix-run/remix/pull/8222))

- Updated dependencies:
  - `@remix-run/server-runtime@2.4.1`
  - `@remix-run/node@2.4.1`

## 2.4.0

### Minor Changes

- Vite: exclude modules within `.server` directories from client build ([#8154](https://github.com/remix-run/remix/pull/8154))

- Add support for `clientLoader`/`clientAction`/`HydrateFallback` route exports ([RFC](https://github.com/remix-run/remix/discussions/7634)) ([#8173](https://github.com/remix-run/remix/pull/8173))

  Remix now supports loaders/actions that run on the client (in addition to, or instead of the loader/action that runs on the server). While we still recommend server loaders/actions for the majority of your data needs in a Remix app - these provide some levers you can pull for more advanced use-cases such as:

  - Leveraging a data source local to the browser (i.e., `localStorage`)
  - Managing a client-side cache of server data (like `IndexedDB`)
  - Bypassing the Remix server in a BFF setup and hitting your API directly from the browser
  - Migrating a React Router SPA to a Remix application

  By default, `clientLoader` will not run on hydration, and will only run on subsequent client side navigations.

  If you wish to run your client loader on hydration, you can set `clientLoader.hydrate=true` to force Remix to execute it on initial page load. Keep in mind that Remix will still SSR your route component so you should ensure that there is no new _required_ data being added by your `clientLoader`.

  If your `clientLoader` needs to run on hydration and adds data you require to render the route component, you can export a `HydrateFallback` component that will render during SSR, and then your route component will not render until the `clientLoader` has executed on hydration.

  `clientAction` is simpler than `clientLoader` because it has no hydration use-cases. `clientAction` will only run on client-side navigations.

  For more information, please refer to the [`clientLoader`](https://remix.run/route/client-loader) and [`clientAction`](https://remix.run/route/client-action) documentation.

- Vite: Strict route exports ([#8171](https://github.com/remix-run/remix/pull/8171))

  With Vite, Remix gets stricter about which exports are allowed from your route modules.
  Previously, the Remix compiler would allow any export from routes.
  While this was convenient, it was also a common source of bugs that were hard to track down because they only surfaced at runtime.

  For more, see <https://remix.run/docs/en/main/future/vite#strict-route-exports>

- Add a new `future.v3_relativeSplatPath` flag to implement a breaking bug fix to relative routing when inside a splat route. For more information, please see the React Router [`6.21.0` Release Notes](https://github.com/remix-run/react-router/blob/release-next/CHANGELOG.md#futurev7_relativesplatpath) and the [`useResolvedPath` docs](https://remix.run/hooks/use-resolved-path#splat-paths). ([#8216](https://github.com/remix-run/remix/pull/8216))

### Patch Changes

- Upgrade Vite peer dependency range to v5 ([#8172](https://github.com/remix-run/remix/pull/8172))

- Support HMR for routes with `handle` export in Vite dev ([#8022](https://github.com/remix-run/remix/pull/8022))

- Fix flash of unstyled content for non-Express custom servers in Vite dev ([#8076](https://github.com/remix-run/remix/pull/8076))

- Bundle CSS imported in client entry file in Vite plugin ([#8143](https://github.com/remix-run/remix/pull/8143))

- Change Vite build output paths to fix a conflict between how Vite and the Remix compiler each manage the `public` directory. ([#8077](https://github.com/remix-run/remix/pull/8077))

  **This is a breaking change for projects using the unstable Vite plugin.**

  The server is now compiled into `build/server` rather than `build`, and the client is now compiled into `build/client` rather than `public`.

  For more information on the changes and guidance on how to migrate your project, refer to the updated [Remix Vite documentation](https://remix.run/docs/en/main/future/vite).

- Remove undocumented `legacyCssImports` option from Vite plugin due to issues with `?url` imports of CSS files not being processed correctly in Vite ([#8096](https://github.com/remix-run/remix/pull/8096))

- Vite: fix access to default `entry.{client,server}.tsx` within pnpm workspace on Windows ([#8057](https://github.com/remix-run/remix/pull/8057))

- Remove `unstable_createViteServer` and `unstable_loadViteServerBuild` which were only minimal wrappers around Vite's `createServer` and `ssrLoadModule` functions when using a custom server. ([#8120](https://github.com/remix-run/remix/pull/8120))

  **This is a breaking change for projects using the unstable Vite plugin with a custom server.**

  Instead, we now provide `unstable_viteServerBuildModuleId` so that custom servers interact with Vite directly rather than via Remix APIs, for example:

  ```diff
  -import {
  -  unstable_createViteServer,
  -  unstable_loadViteServerBuild,
  -} from "@remix-run/dev";
  +import { unstable_viteServerBuildModuleId } from "@remix-run/dev";
  ```

  Creating the Vite server in middleware mode:

  ```diff
  const vite =
    process.env.NODE_ENV === "production"
      ? undefined
  -    : await unstable_createViteServer();
  +    : await import("vite").then(({ createServer }) =>
  +        createServer({
  +          server: {
  +            middlewareMode: true,
  +          },
  +        })
  +      );
  ```

  Loading the Vite server build in the request handler:

  ```diff
  app.all(
    "*",
    createRequestHandler({
      build: vite
  -      ? () => unstable_loadViteServerBuild(vite)
  +      ? () => vite.ssrLoadModule(unstable_viteServerBuildModuleId)
        : await import("./build/server/index.js"),
    })
  );
  ```

- Pass request handler errors to `vite.ssrFixStacktrace` in Vite dev to ensure stack traces correctly map to the original source code ([#8066](https://github.com/remix-run/remix/pull/8066))

- Vite: Preserve names for exports from .client imports ([#8200](https://github.com/remix-run/remix/pull/8200))

  Unlike `.server` modules, the main idea is not to prevent code from leaking into the server build
  since the client build is already public. Rather, the goal is to isolate the SSR render from client-only code.
  Routes need to import code from `.client` modules without compilation failing and then rely on runtime checks
  to determine if the code is running on the server or client.

  Replacing `.client` modules with empty modules would cause the build to fail as ESM named imports are statically analyzed.
  So instead, we preserve the named export but replace each exported value with an empty object.
  That way, the import is valid at build time and the standard runtime checks can be used to determine if then
  code is running on the server or client.

- Add `@remix-run/node` to Vite's `optimizeDeps.include` array ([#8177](https://github.com/remix-run/remix/pull/8177))

- Improve Vite plugin performance ([#8121](https://github.com/remix-run/remix/pull/8121))

  - Parallelize detection of route module exports
  - Disable `server.preTransformRequests` in Vite child compiler since it's only used to process route modules

- Remove automatic global Node polyfill installation from the built-in Vite dev server and instead allow explicit opt-in. ([#8119](https://github.com/remix-run/remix/pull/8119))

  **This is a breaking change for projects using the unstable Vite plugin without a custom server.**

  If you're not using a custom server, you should call `installGlobals` in your Vite config instead.

  ```diff
  import { unstable_vitePlugin as remix } from "@remix-run/dev";
  +import { installGlobals } from "@remix-run/node";
  import { defineConfig } from "vite";

  +installGlobals();

  export default defineConfig({
    plugins: [remix()],
  });
  ```

- Vite: Errors at build-time when client imports .server default export ([#8184](https://github.com/remix-run/remix/pull/8184))

  Remix already stripped .server file code before ensuring that server code never makes it into the client.
  That results in errors when client code tries to import server code, which is exactly what we want!
  But those errors were happening at runtime for default imports.
  A better experience is to have those errors happen at build-time so that you guarantee that your users won't hit them.

- Fix `request instanceof Request` checks when using Vite dev server ([#8062](https://github.com/remix-run/remix/pull/8062))

- Updated dependencies:
  - `@remix-run/server-runtime@2.4.0`
  - `@remix-run/node@2.4.0`

## 2.3.1

### Patch Changes

- Support `nonce` prop on `LiveReload` component in Vite dev ([#8014](https://github.com/remix-run/remix/pull/8014))
- Ensure code-split JS files in the server build's assets directory aren't cleaned up after Vite build ([#8042](https://github.com/remix-run/remix/pull/8042))
- Fix redundant copying of assets from `public` directory in Vite build ([#8039](https://github.com/remix-run/remix/pull/8039))
  - This ensures that static assets aren't duplicated in the server build directory
  - This also fixes an issue where the build would break if `assetsBuildDirectory` was deeply nested within the `public` directory
- Updated dependencies:
  - `@remix-run/node@2.3.1`
  - `@remix-run/server-runtime@2.3.1`

## 2.3.0

### Patch Changes

- Support rendering of `LiveReload` component after `Scripts` in Vite dev ([#7919](https://github.com/remix-run/remix/pull/7919))
- fix(vite): fix "react-refresh/babel" resolution for custom server with pnpm ([#7904](https://github.com/remix-run/remix/pull/7904))
- Support JSX usage in `.jsx` files without manual `React` import in Vite ([#7888](https://github.com/remix-run/remix/pull/7888))
- Support optional rendering of `LiveReload` component in Vite dev ([#7919](https://github.com/remix-run/remix/pull/7919))
- Fix Vite production builds when plugins that have different local state between `development` and `production` modes are present, e.g. `@mdx-js/rollup`. ([#7911](https://github.com/remix-run/remix/pull/7911))
- Cache resolution of Remix Vite plugin options ([#7908](https://github.com/remix-run/remix/pull/7908))
- Support Vite 5 ([#7846](https://github.com/remix-run/remix/pull/7846))
- Allow `process.env.NODE_ENV` values other than `"development"` in Vite dev ([#7980](https://github.com/remix-run/remix/pull/7980))
- Attach CSS from shared chunks to routes in Vite build ([#7952](https://github.com/remix-run/remix/pull/7952))
- fix(vite): Let Vite handle serving files outside of project root via `/@fs` ([#7913](https://github.com/remix-run/remix/pull/7913))
  - This fixes errors when using default client entry or server entry in a pnpm project where those files may be outside of the project root, but within the workspace root.
  - By default, Vite prevents access to files outside the workspace root (when using workspaces) or outside of the project root (when not using workspaces) unless user explicitly opts into it via Vite's `server.fs.allow`.
- Improve performance of LiveReload proxy in Vite dev ([#7883](https://github.com/remix-run/remix/pull/7883))
- fix(vite): deduplicate `@remix-run/react` ([#7926](https://github.com/remix-run/remix/pull/7926))
  - Pre-bundle Remix dependencies to avoid Remix router duplicates.
  - Our remix-react-proxy plugin does not process default client and
  - server entry files since those come from within `node_modules`.
  - That means that before Vite pre-bundles dependencies (e.g. first time dev server is run) mismatching Remix routers cause `Error: You must render this element inside a <Remix> element`.
- Fix React Fast Refresh error on load when using `defer` in Vite dev server ([#7842](https://github.com/remix-run/remix/pull/7842))
- Handle multiple "Set-Cookie" headers in Vite dev server ([#7843](https://github.com/remix-run/remix/pull/7843))
- Fix flash of unstyled content on initial page load in Vite dev when using a custom Express server ([#7937](https://github.com/remix-run/remix/pull/7937))
- Emit assets that were only referenced in the server build into the client assets directory in Vite build ([#7892](https://github.com/remix-run/remix/pull/7892), cherry-picked in [`8cd31d65`](https://github.com/remix-run/remix/commit/8cd31d6543ef4c765220fc64dca9bcc9c61ee9eb))
- Populate `process.env` from `.env` files on the server in Vite dev ([#7958](https://github.com/remix-run/remix/pull/7958))
- Fix `FutureConfig` type ([#7895](https://github.com/remix-run/remix/pull/7895))
- Updated dependencies:
  - `@remix-run/server-runtime@2.3.0`
  - `@remix-run/node@2.3.0`

## 2.2.0

### Minor Changes

- Unstable Vite support for Node-based Remix apps ([#7590](https://github.com/remix-run/remix/pull/7590))
  - `remix build` 👉 `vite build && vite build --ssr`
  - `remix dev` 👉 `vite dev`
  - Other runtimes (e.g. Deno, Cloudflare) not yet supported.
  - See "Future > Vite" in the Remix Docs for details
- Add a new `future.v3_fetcherPersist` flag to change the persistence behavior of fetchers. Instead of being immediately cleaned up when unmounted in the UI, fetchers will persist until they return to an `idle` state ([RFC](https://github.com/remix-run/remix/discussions/7698)) ([#7704](https://github.com/remix-run/remix/pull/7704))
  - For more details, please refer to the [React Router 6.18.0](https://github.com/remix-run/react-router/releases/tag/react-router%406.18.0) release notes

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.2.0`
  - `@remix-run/node@2.2.0`

## 2.1.0

### Patch Changes

- Sourcemap takes into account special chars in output file ([#7574](https://github.com/remix-run/remix/pull/7574))
- Updated dependencies:
  - `@remix-run/server-runtime@2.1.0`

## 2.0.1

### Patch Changes

- Fix types for MDX files when using pnpm ([#7491](https://github.com/remix-run/remix/pull/7491))
- Update `getDependenciesToBundle` to handle ESM packages without main exports ([#7272](https://github.com/remix-run/remix/pull/7272))
  - Note that these packages must expose `package.json` in their `exports` field so that their path can be resolved
- Fix server builds where `serverBuildPath` extension is `.cjs` ([#7180](https://github.com/remix-run/remix/pull/7180))
- Updated dependencies:
  - `@remix-run/server-runtime@2.0.1`

## 2.0.0

### Major Changes

- The `create-remix` CLI has been rewritten to feature a cleaner interface, Git repo initialization and optional `remix.init` script execution. The interactive template prompt and official Remix stack/template shorthands have also been removed so that community/third-party templates are now on a more equal footing. ([#6887](https://github.com/remix-run/remix/pull/6887))
  - The code for `create-remix` has been moved out of the Remix CLI since it's not intended for use within an existing Remix application
  - This means that the `remix create` command is no longer available.
- Enable built-in PostCSS and Tailwind support by default. ([#6909](https://github.com/remix-run/remix/pull/6909))
  - These tools are now automatically used within the Remix compiler if PostCSS and/or Tailwind configuration files are present in your project.
  - If you have a custom PostCSS and/or Tailwind setup outside of Remix, you can disable these features in your `remix.config.js` via the `postcss:false` and/or `tailwind:false` flags
- Drop React 17 support ([#7121](https://github.com/remix-run/remix/pull/7121))
- Require Node >=18.0.0 ([#6939](https://github.com/remix-run/remix/pull/6939))
- Compile server build to Node 18 ([#7292](https://github.com/remix-run/remix/pull/7292))
  - This allows features like top-level `await` to be used within a Remix app
- Remove default Node.js polyfills - you must now opt-into polyfills via the [`serverNodeBuiltinsPolyfill`](https://remix.run/docs/en/2.0.0/start/v2#servernodebuiltinspolyfill) and [`browserNodeBuiltinsPolyfill`](https://remix.run/docs/en/2.0.0/start/v2#browsernodebuiltinspolyfill) configs ([#7269](https://github.com/remix-run/remix/pull/7269))
- Remove `v2_errorBoundary` flag and `CatchBoundary` implementation ([#6906](https://github.com/remix-run/remix/pull/6906))
- Remove `v2_normalizeFormMethod` future flag - all `formMethod` values will be normalized in v2 ([#6875](https://github.com/remix-run/remix/pull/6875))
- Remove `v2_routeConvention` flag - the flat route file convention is now standard ([#6969](https://github.com/remix-run/remix/pull/6969))
- Remove `v2_headers` flag - it is now the default behavior to use the deepest `headers` function in the route tree ([#6979](https://github.com/remix-run/remix/pull/6979))
- The route `meta` API now defaults to the new "V2 Meta" API ([#6958](https://github.com/remix-run/remix/pull/6958))
  - Please refer to the ([docs](https://remix.run/docs/en/2.0.0/route/meta) and [Preparing for V2](https://remix.run/docs/en/2.0.0/start/v2#route-meta) guide for more information.
- Default to `serverModuleFormat: "esm"` and update `remix-serve` to use dynamic import to support ESM and CJS build outputs ([#6949](https://github.com/remix-run/remix/pull/6949))
- Remove `serverBuildTarget` config option ([#6896](https://github.com/remix-run/remix/pull/6896))
- Remove deprecated `REMIX_DEV_HTTP_ORIGIN` env var - use `REMIX_DEV_ORIGIN` instead ([#6963](https://github.com/remix-run/remix/pull/6963))
- Remove `devServerBroadcastDelay` config option ([#7063](https://github.com/remix-run/remix/pull/7063))
- Remove deprecated `devServerPort` option - use `--port` / `dev.port` instead ([#7078](https://github.com/remix-run/remix/pull/7078))
- Remove deprecated `REMIX_DEV_SERVER_WS_PORT` env var - use `remix dev`'s '`--port` / `port` option instead ([#6965](https://github.com/remix-run/remix/pull/6965))
- Stop passing `isTypeScript` to `remix.init` script ([#7099](https://github.com/remix-run/remix/pull/7099))
- Remove `replace-remix-magic-imports` codemod ([#6899](https://github.com/remix-run/remix/pull/6899))
- Remove deprecated `--no-restart`/`restart` cli args/flags - use `--manual`/`manual` instead ([#6962](https://github.com/remix-run/remix/pull/6962))
- Remove deprecated `--scheme`/`scheme` and `--host`/`host` cli args/flags - use `REMIX_DEV_ORIGIN` instead ([#6962](https://github.com/remix-run/remix/pull/6962))
- Promote the `future.v2_dev` flag in `remix.config.js` to a root level `dev` config ([#7002](https://github.com/remix-run/remix/pull/7002))
- Remove `browserBuildDirectory` config option ([#6900](https://github.com/remix-run/remix/pull/6900))
- Remove `serverBuildDirectory` config option (\[#6897]\(<https://github.com/remix-run/remix/pull/-> Remove `codemod` command ([#6918](https://github.com/remix-run/remix/pull/6918))
  6897\))
- Removed support for "magic exports" from the `remix` package. This package can be removed from your `package.json` and you should update all imports to use the source `@remix-run/*` packages: ([#6895](https://github.com/remix-run/remix/pull/6895))

  ```diff
  - import type { ActionArgs } from "remix";
  - import { json, useLoaderData } from "remix";
  + import type { ActionArgs } from "@remix-run/node";
  + import { json } from "@remix-run/node";
  + import { useLoaderData } from "@remix-run/react";
  ```

### Minor Changes

- Warn users about obsolete future flags in `remix.config.js` ([#7048](https://github.com/remix-run/remix/pull/7048))
- Detect built mode via `build.mode` ([#6964](https://github.com/remix-run/remix/pull/6964))
  - Prevents mode mismatch between built Remix server entry and user-land server
  - Additionally, all runtimes (including non-Node runtimes) can use `build.mode` to determine if HMR should be performed
- Support `bun` package manager ([#7074](https://github.com/remix-run/remix/pull/7074))
- The `serverNodeBuiltinsPolyfill` option (along with the newly added `browserNodeBuiltinsPolyfill`) now supports defining global polyfills in addition to module polyfills ([#7269](https://github.com/remix-run/remix/pull/7269))

  - For example, to polyfill Node's `Buffer` global:

    ```js
    module.exports = {
      serverNodeBuiltinsPolyfill: {
        globals: {
          Buffer: true,
        },
        // You'll probably need to polyfill the "buffer" module
        // too since the global polyfill imports this:
        modules: {
          buffer: true,
        },
      },
    };
    ```

### Patch Changes

- Fix importing of PNGs, SVGs, and other assets from packages in `node_modules` ([#6813](https://github.com/remix-run/remix/pull/6813), [#7182](https://github.com/remix-run/remix/pull/7182))

- Decouple the `@remix-run/dev` package from the contents of the `@remix-run/css-bundle` package. ([#6982](https://github.com/remix-run/remix/pull/6982))

  - The contents of the `@remix-run/css-bundle` package are now entirely managed by the Remix compiler
  - Even though it's still recommended that your Remix dependencies all share the same version, this change ensures that there are no runtime errors when upgrading `@remix-run/dev` without upgrading `@remix-run/css-bundle`

- Allow non-development modes for `remix watch` ([#7117](https://github.com/remix-run/remix/pull/7117))

- Stop `remix dev` when `esbuild` is not running ([#7158](https://github.com/remix-run/remix/pull/7158))

- Do not interpret JSX in `.ts` files ([#7306](https://github.com/remix-run/remix/pull/7306))

  - While JSX is supported in `.js` files for compatibility with existing apps and libraries,
    `.ts` files should not contain JSX. By not interpreting `.ts` files as JSX, `.ts` files
    can contain single-argument type generics without needing a comma to disambiguate from JSX:

    ```ts
    // this works in .ts files
    const id = <T>(x: T) => x;
    //          ^ single-argument type generic
    ```

    ```tsx
    // this doesn't work in .tsx files
    const id = <T,>(x: T) => x;
    //          ^ is this a JSX element? or a single-argument type generic?
    ```

    ```tsx
    // this works in .tsx files
    const id = <T,>(x: T) => x;
    //           ^ comma: this is a generic, not a JSX element
    const component = <h1>hello</h1>;
    //                   ^ no comma: this is a JSX element
    ```

- Enhance obsolete flag warning for `future.v2_dev` if it was an object, and prompt users to lift it to the root `dev` config ([#7427](https://github.com/remix-run/remix/pull/7427))

- Allow decorators in app code ([#7176](https://github.com/remix-run/remix/pull/7176))

- Allow JSX in `.js` files during HMR ([#7112](https://github.com/remix-run/remix/pull/7112))

- Kill app server when remix dev terminates ([#7280](https://github.com/remix-run/remix/pull/7280))

- Support dependencies that import polyfill packages for Node built-ins via a trailing slash (e.g. importing the `buffer` package with `var Buffer = require('buffer/').Buffer` as recommended in their README) ([#7198](https://github.com/remix-run/remix/pull/7198))

  - These imports were previously marked as external
  - This meant that they were left as dynamic imports in the client bundle and would throw a runtime error in the browser (e.g. `Dynamic require of "buffer/" is not supported`)

- Surface errors when PostCSS config is invalid ([#7391](https://github.com/remix-run/remix/pull/7391))

- Restart dev server when Remix config changes ([#7269](https://github.com/remix-run/remix/pull/7269))

- Remove outdated ESM import warnings ([#6916](https://github.com/remix-run/remix/pull/6916))

  - Most of the time these warnings were false positives.
  - Instead, we now rely on built-in Node warnings for ESM imports.

- Do not trigger rebuilds when `.DS_Store` changes ([#7172](https://github.com/remix-run/remix/pull/7172))

- Remove warnings for stabilized flags: ([#6905](https://github.com/remix-run/remix/pull/6905))

  - `unstable_cssSideEffectImports`
  - `unstable_cssModules`
  - `unstable_vanillaExtract`

- Allow any mode (`NODE_ENV`) ([#7113](https://github.com/remix-run/remix/pull/7113))

- Replace the deprecated [`xdm`](https://github.com/wooorm/xdm) package with [`@mdx-js/mdx`](https://github.com/mdx-js/mdx) ([#4054](https://github.com/remix-run/remix/pull/4054))

- Write a `version.txt` sentinel file _after_ server build is completely written ([#7299](https://github.com/remix-run/remix/pull/7299))

- Updated dependencies:
  - `@remix-run/server-runtime@2.0.0`

## 1.19.3

### Patch Changes

- Show deprecation warning when using `devServerBroadcastDelay` and `devServerPort` config options ([#7064](https://github.com/remix-run/remix/pull/7064))
- Updated dependencies:
  - `@remix-run/server-runtime@1.19.3`

## 1.19.2

### Patch Changes

- Update `proxy-agent` to resolve npm audit security vulnerability ([#7027](https://github.com/remix-run/remix/pull/7027))
- Updated dependencies:
  - `@remix-run/server-runtime@1.19.2`

## 1.19.1

### Patch Changes

- Add a heartbeat ping to prevent the WebSocket connection from being closed due to inactivity when using a proxy like Cloudflare ([#6904](https://github.com/remix-run/remix/pull/6904), [#6927](https://github.com/remix-run/remix/pull/6927))
- Treeshake out HMR code from production builds ([#6894](https://github.com/remix-run/remix/pull/6894))
- Updated dependencies:
  - `@remix-run/server-runtime@1.19.1`

## 1.19.0

### Minor Changes

- improved networking options for `v2_dev` ([#6724](https://github.com/remix-run/remix/pull/6724))

  deprecate the `--scheme` and `--host` options and replace them with the `REMIX_DEV_ORIGIN` environment variable

- Output esbuild metafiles for bundle analysis ([#6772](https://github.com/remix-run/remix/pull/6772))

  Written to server build directory (`build/` by default):

  - `metafile.css.json`
  - `metafile.js.json` (browser JS)
  - `metafile.server.json` (server JS)

  Metafiles can be uploaded to <https://esbuild.github.io/analyze/> for analysis.

- Add `serverNodeBuiltinsPolyfill` config option. In `remix.config.js` you can now disable polyfills of Node.js built-in modules for non-Node.js server platforms, or opt into a subset of polyfills. ([#6814](https://github.com/remix-run/remix/pull/6814), [#6859](https://github.com/remix-run/remix/pull/6859), [#6877](https://github.com/remix-run/remix/pull/6877))

  ```js
  // Disable all polyfills
  exports.serverNodeBuiltinsPolyfill = { modules: {} };

  // Enable specific polyfills
  exports.serverNodeBuiltinsPolyfill = {
    modules: {
      crypto: true, // Provide a JSPM polyfill
      fs: "empty", // Provide an empty polyfill
    },
  };
  ```

### Patch Changes

- ignore missing react-dom/client for react 17 ([#6725](https://github.com/remix-run/remix/pull/6725))

- Warn if not using `v2_dev` ([#6818](https://github.com/remix-run/remix/pull/6818))

  Also, rename `--no-restart` to `--manual` to match intention and documentation.
  `--no-restart` remains an alias for `--manual` in v1 for backwards compatibility.

- ignore errors when killing already dead processes ([#6773](https://github.com/remix-run/remix/pull/6773))

- Always rewrite css-derived assets during builds ([#6837](https://github.com/remix-run/remix/pull/6837))

- fix sourcemaps for `v2_dev` ([#6762](https://github.com/remix-run/remix/pull/6762))

- Do not clear screen when dev server starts ([#6719](https://github.com/remix-run/remix/pull/6719))

  On some terminal emulators, "clearing" only scrolls the next line to the
  top. on others, it erases the scrollback.

  Instead, let users call `clear` themselves (`clear && remix dev`) if
  they want to clear.

- Updated dependencies:
  - `@remix-run/server-runtime@1.19.0`

## 1.18.1

### Patch Changes

- Ignore missing `react-dom/client` for React 17 ([#6725](https://github.com/remix-run/remix/pull/6725))
- Updated dependencies:
  - `@remix-run/server-runtime@1.18.1`

## 1.18.0

### Minor Changes

- stabilize v2 dev server ([#6615](https://github.com/remix-run/remix/pull/6615))
- improved logging for `remix build` and `remix dev` ([#6596](https://github.com/remix-run/remix/pull/6596))

### Patch Changes

- fix docs links for msw and mkcert ([#6672](https://github.com/remix-run/remix/pull/6672))
- fix `remix dev -c`: kill all descendant processes of specified command when restarting ([#6663](https://github.com/remix-run/remix/pull/6663))
- Add caching to regular stylesheet compilation ([#6638](https://github.com/remix-run/remix/pull/6638))
- Rename `Architect (AWS Lambda)` -> `Architect` in the `create-remix` CLI to avoid confusion for other methods of deploying to AWS (i.e., SST) ([#6484](https://github.com/remix-run/remix/pull/6484))
- Improve CSS bundle build performance by skipping unused Node polyfills ([#6639](https://github.com/remix-run/remix/pull/6639))
- Improve performance of CSS bundle build by skipping compilation of Remix/React packages that are known not to contain CSS imports ([#6654](https://github.com/remix-run/remix/pull/6654))
- Cache CSS side-effect imports transform when using HMR ([#6622](https://github.com/remix-run/remix/pull/6622))
- Fix bug with pathless layout routes beneath nested path segments ([#6649](https://github.com/remix-run/remix/pull/6649))
- Add caching to PostCSS for CSS Modules ([#6604](https://github.com/remix-run/remix/pull/6604))
- Add caching to PostCSS for side-effect imports ([#6554](https://github.com/remix-run/remix/pull/6554))
- cache getRouteModuleExports calls to significantly speed up build and HMR rebuild times ([#6629](https://github.com/remix-run/remix/pull/6629))
- group rebuild logs with surrounding whitespace ([#6607](https://github.com/remix-run/remix/pull/6607))
- instructions for integrating with msw ([#6669](https://github.com/remix-run/remix/pull/6669))
- Update minimum version of `esbuild-plugins-node-modules-polyfill` to 1.0.16 to ensure that the plugin is cached ([#6652](https://github.com/remix-run/remix/pull/6652))
- Updated dependencies:
  - `@remix-run/server-runtime@1.18.0`

## 1.17.1

### Patch Changes

- Replace `esbuild-plugin-polyfill-node` with `esbuild-plugins-node-modules-polyfill` ([#6562](https://github.com/remix-run/remix/pull/6562))
- Lazily generate CSS bundle when import of `@remix-run/css-bundle` is detected ([#6535](https://github.com/remix-run/remix/pull/6535))
- Updated dependencies:
  - `@remix-run/server-runtime@1.17.1`

## 1.17.0

### Minor Changes

- built-in tls support ([#6483](https://github.com/remix-run/remix/pull/6483))

  New options:

  - `--tls-key` / `tlsKey`: TLS key
  - `--tls-cert` / `tlsCert`: TLS Certificate

  If both TLS options are set, `scheme` defaults to `https`

  ## Example

  Install [mkcert](https://github.com/FiloSottile/mkcert) and create a local CA:

  ```sh
  brew install mkcert
  mkcert -install
  ```

  Then make sure you inform `node` about your CA certs:

  ```sh
  export NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"
  ```

  👆 You'll probably want to put that env var in your scripts or `.bashrc`/`.zshrc`

  Now create `key.pem` and `cert.pem`:

  ```sh
  mkcert -key-file key.pem -cert-file cert.pem localhost
  ```

  See `mkcert` docs for more details.

  Finally, pass in the paths to the key and cert via flags:

  ```sh
  remix dev --tls-key=key.pem --tls-cert=cert.pem
  ```

  or via config:

  ```js
  module.exports = {
    future: {
      unstable_dev: {
        tlsKey: "key.pem",
        tlsCert: "cert.pem",
      },
    },
  };
  ```

  That's all that's needed to set up the Remix Dev Server with TLS.

  🚨 Make sure to update your app server for TLS as well.

  For example, with `express`:

  ```ts
  import fs from "node:fs";
  import https from "node:https";

  import express from "express";

  const app = express();

  // ...code setting up your express app...

  const appServer = https.createServer(
    {
      key: fs.readFileSync("key.pem"),
      cert: fs.readFileSync("cert.pem"),
    },
    app
  );

  appServer.listen(3000, () => {
    console.log("Ready on https://localhost:3000");
  });
  ```

  ## Known limitations

  `remix-serve` does not yet support TLS.
  That means this only works for custom app server using the `-c` flag for now.

- Reuse dev server port for WebSocket (Live Reload,HMR,HDR) ([#6476](https://github.com/remix-run/remix/pull/6476))

  As a result the `webSocketPort`/`--websocket-port` option has been obsoleted.
  Additionally, scheme/host/port options for the dev server have been renamed.

  Available options are:

  | Option     | flag               | config           | default                           |
  | ---------- | ------------------ | ---------------- | --------------------------------- |
  | Command    | `-c` / `--command` | `command`        | `remix-serve <server build path>` |
  | Scheme     | `--scheme`         | `scheme`         | `http`                            |
  | Host       | `--host`           | `host`           | `localhost`                       |
  | Port       | `--port`           | `port`           | Dynamically chosen open port      |
  | No restart | `--no-restart`     | `restart: false` | `restart: true`                   |

  Note that scheme/host/port options are for the _dev server_, not your app server.
  You probably don't need to use scheme/host/port option if you aren't configuring networking (e.g. for Docker or SSL).

### Patch Changes

- Add caching to PostCSS for regular stylesheets ([#6505](https://github.com/remix-run/remix/pull/6505))

- Fix warnings when importing CSS files with `future.unstable_dev` enabled ([#6506](https://github.com/remix-run/remix/pull/6506))

- Fix Tailwind performance issue when `postcss.config.js` contains `plugins: { tailwindcss: {} }` and `remix.config.js` contains both `tailwind: true` and `postcss: true`. ([#6468](https://github.com/remix-run/remix/pull/6468))

  Note that this was _not_ an issue when the plugin function had been explicitly called, i.e. `plugins: [tailwindcss()]`. Remix avoids adding the Tailwind plugin to PostCSS if it's already present but we were failing to detect when the plugin function hadn't been called — either because the plugin function itself had been passed, i.e. `plugins: [require('tailwindcss')]`, or the plugin config object syntax had been used, i.e. `plugins: { tailwindcss: {} }`.

- Faster server export removal for routes when `unstable_dev` is enabled. ([#6455](https://github.com/remix-run/remix/pull/6455))

  Also, only render modulepreloads on SSR.
  Do not render modulepreloads when hydrated.

- Add `HeadersArgs` type to be consistent with loaders/actions/meta and allows for using a `function` declaration in addition to an arrow function expression ([#6247](https://github.com/remix-run/remix/pull/6247))

  ```tsx
  import type { HeadersArgs } from "@remix-run/node"; // or cloudflare/deno

  export function headers({ loaderHeaders }: HeadersArgs) {
    return {
      "x-my-custom-thing": loaderHeaders.get("x-my-custom-thing") || "fallback",
    };
  }
  ```

- better error message when `remix-serve` is not found ([#6477](https://github.com/remix-run/remix/pull/6477))

- restore color for app server output ([#6485](https://github.com/remix-run/remix/pull/6485))

- Fix route ranking bug with pathless layout route next to a sibling index route ([#4421](https://github.com/remix-run/remix/pull/4421))

  - Under the hood this is done by removing the trailing slash from all generated `path` values since the number of slash-delimited segments counts towards route ranking so the trailing slash incorrectly increases the score for routes

- Support sibling pathless layout routes by removing pathless layout routes from the unique route path checks in conventional route generation since they inherently trigger duplicate paths ([#4421](https://github.com/remix-run/remix/pull/4421))

- fix dev server crashes caused by ungraceful hdr error handling ([#6467](https://github.com/remix-run/remix/pull/6467))

- Updated dependencies:
  - `@remix-run/server-runtime@1.17.0`

## 1.16.1

### Patch Changes

- Cross-module `loader` change detection for HDR ([#6299](https://github.com/remix-run/remix/pull/6299))
- Normalize path for dev server `PATH` envvar so that it works cross-platform (e.g. Windows) ([#6310](https://github.com/remix-run/remix/pull/6310))
- Fix CSS imports in JS files that use JSX ([#6309](https://github.com/remix-run/remix/pull/6309))
- Kill app server when dev server exits ([#6395](https://github.com/remix-run/remix/pull/6395))
- Wait until app server is killed before starting a new app server ([#6289](https://github.com/remix-run/remix/pull/6289))
- Ensure CSS bundle changes result in a new manifest hash ([#6374](https://github.com/remix-run/remix/pull/6374))
- Normalize file paths before testing if a changed file is a route entry ([#6293](https://github.com/remix-run/remix/pull/6293))
- Fix race where app server responds with updated manifest version _before_ dev server is listening for it ([#6294](https://github.com/remix-run/remix/pull/6294))
  - dev server now listens for updated versions _before_ writing the server changes, guaranteeing that it is listening before the app server gets a chance to send its 'ready' message
- Only process `.css.ts`/`.css.js` files with Vanilla Extract if `@vanilla-extract/css` is installed ([#6345](https://github.com/remix-run/remix/pull/6345))
- Stop modifying a user's `tsconfig.json` when running using `getConfig` (`remix dev`, `remix routes`, `remix build`, etc) ([#6156](https://github.com/remix-run/remix/pull/6156))
- Cancel previous build when rebuild is kicked off to prevent rebuilds from hanging ([#6295](https://github.com/remix-run/remix/pull/6295))
- Update minimum version of Babel dependencies to avoid errors parsing decorators ([#6390](https://github.com/remix-run/remix/pull/6390))
- Support asset imports when detecting loader changes for HDR ([#6396](https://github.com/remix-run/remix/pull/6396))
- Updated dependencies:
  - `@remix-run/server-runtime@1.16.1`

## 1.16.0

### Minor Changes

- Enable support for [CSS Modules](https://github.com/css-modules/css-modules), [Vanilla Extract](http://vanilla-extract.style) and CSS side-effect imports ([#6046](https://github.com/remix-run/remix/pull/6046))

  These CSS bundling features were previously only available via `future.unstable_cssModules`, `future.unstable_vanillaExtract` and `future.unstable_cssSideEffectImports` options in `remix.config.js`, but they have now been stabilized.

  In order to use these features, check out our guide to [CSS bundling](https://remix.run/docs/en/1.16.0/guides/styling#css-bundling) in your project.

- Stabilize built-in PostCSS support via the new `postcss` option in `remix.config.js`. As a result, the `future.unstable_postcss` option has also been deprecated. ([#5960](https://github.com/remix-run/remix/pull/5960))

  The `postcss` option is `false` by default, but when set to `true` will enable processing of all CSS files using PostCSS if `postcss.config.js` is present.

  If you followed the original PostCSS setup guide for Remix, you may have a folder structure that looks like this, separating your source files from its processed output:

      .
      ├── app
      │   └── styles (processed files)
      │       ├── app.css
      │       └── routes
      │           └── index.css
      └── styles (source files)
          ├── app.css
          └── routes
              └── index.css

  After you've enabled the new `postcss` option, you can delete the processed files from `app/styles` folder and move your source files from `styles` to `app/styles`:

      .
      ├── app
      │   └── styles (source files)
      │       ├── app.css
      │       └── routes
      │           └── index.css

  You should then remove `app/styles` from your `.gitignore` file since it now contains source files rather than processed output.

  You can then update your `package.json` scripts to remove any usage of `postcss` since Remix handles this automatically. For example, if you had followed the original setup guide:

  ```diff
  {
    "scripts": {
  -    "dev:css": "postcss styles --base styles --dir app/styles -w",
  -    "build:css": "postcss styles --base styles --dir app/styles --env production",
  -    "dev": "concurrently \"npm run dev:css\" \"remix dev\""
  +    "dev": "remix dev"
    }
  }
  ```

- Stabilize built-in Tailwind support via the new `tailwind` option in `remix.config.js`. As a result, the `future.unstable_tailwind` option has also been deprecated. ([#5960](https://github.com/remix-run/remix/pull/5960))

  The `tailwind` option is `false` by default, but when set to `true` will enable built-in support for Tailwind functions and directives in your CSS files if `tailwindcss` is installed.

  If you followed the original Tailwind setup guide for Remix and want to make use of this feature, you should first delete the generated `app/tailwind.css`.

  Then, if you have a `styles/tailwind.css` file, you should move it to `app/tailwind.css`.

  ```sh
  rm app/tailwind.css
  mv styles/tailwind.css app/tailwind.css
  ```

  Otherwise, if you don't already have an `app/tailwind.css` file, you should create one with the following contents:

  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

  You should then remove `/app/tailwind.css` from your `.gitignore` file since it now contains source code rather than processed output.

  You can then update your `package.json` scripts to remove any usage of `tailwindcss` since Remix handles this automatically. For example, if you had followed the original setup guide:

  ```diff
  {
    // ...
    "scripts": {
  -    "build": "run-s \"build:*\"",
  +    "build": "remix build",
  -    "build:css": "npm run generate:css -- --minify",
  -    "build:remix": "remix build",
  -    "dev": "run-p \"dev:*\"",
  +    "dev": "remix dev",
  -    "dev:css": "npm run generate:css -- --watch",
  -    "dev:remix": "remix dev",
  -    "generate:css": "npx tailwindcss -o ./app/tailwind.css",
      "start": "remix-serve build"
    }
    // ...
  }
  ```

- The Remix dev server spins up your app server as a managed subprocess. ([#6133](https://github.com/remix-run/remix/pull/6133))
  This keeps your development environment as close to production as possible.
  It also means that the Remix dev server is compatible with _any_ app server.

  By default, the dev server will use the Remix App Server, but you opt to use your own app server by specifying the command to run it via the `-c`/`--command` flag:

  ```sh
  remix dev # uses `remix-serve <serve build path>` as the app server
  remix dev -c "node ./server.js" # uses your custom app server at `./server.js`
  ```

  The dev server will:

  - force `NODE_ENV=development` and warn you if it was previously set to something else
  - rebuild your app whenever your Remix app code changes
  - restart your app server whenever rebuilds succeed
  - handle live reload and HMR + Hot Data Revalidation

  ### App server coordination

  In order to manage your app server, the dev server needs to be told what server build is currently being used by your app server.
  This works by having the app server send a "I'm ready!" message with the Remix server build hash as the payload.

  This is handled automatically in Remix App Server and is set up for you via calls to `broadcastDevReady` or `logDevReady` in the official Remix templates.

  If you are not using Remix App Server and your server doesn't call `broadcastDevReady`, you'll need to call it in your app server _after_ it is up and running.
  For example, in an Express server:

  ```js
  // server.js
  // <other imports>
  import { broadcastDevReady } from "@remix-run/node";

  // Path to Remix's server build directory ('build/' by default)
  const BUILD_DIR = path.join(process.cwd(), "build");

  // <code setting up your express server>

  app.listen(3000, () => {
    const build = require(BUILD_DIR);
    console.log("Ready: http://localhost:" + port);

    // in development, call `broadcastDevReady` _after_ your server is up and running
    if (process.env.NODE_ENV === "development") {
      broadcastDevReady(build);
    }
  });
  ```

  ### Options

  Options priority order is: 1. flags, 2. config, 3. defaults.

  | Option         | flag               | config           | default                           |
  | -------------- | ------------------ | ---------------- | --------------------------------- |
  | Command        | `-c` / `--command` | `command`        | `remix-serve <server build path>` |
  | HTTP(S) scheme | `--http-scheme`    | `httpScheme`     | `http`                            |
  | HTTP(S) host   | `--http-host`      | `httpHost`       | `localhost`                       |
  | HTTP(S) port   | `--http-port`      | `httpPort`       | Dynamically chosen open port      |
  | Websocket port | `--websocket-port` | `websocketPort`  | Dynamically chosen open port      |
  | No restart     | `--no-restart`     | `restart: false` | `restart: true`                   |

  🚨 The `--http-*` flags are only used for internal dev server <-> app server communication.
  Your app will run on your app server's normal URL.

  To set `unstable_dev` configuration, replace `unstable_dev: true` with `unstable_dev: { <options> }`.
  For example, to set the HTTP(S) port statically:

  ```js
  // remix.config.js
  module.exports = {
    future: {
      unstable_dev: {
        httpPort: 8001,
      },
    },
  };
  ```

  #### SSL and custom hosts

  You should only need to use the `--http-*` flags and `--websocket-port` flag if you need fine-grain control of what scheme/host/port for the dev server.
  If you are setting up SSL or Docker networking, these are the flags you'll want to use.

  🚨 Remix **will not** set up SSL and custom host for you.
  The `--http-scheme` and `--http-host` flag are for you to tell Remix how you've set things up.
  It is your task to set up SSL certificates and host files if you want those features.

  #### `--no-restart` and `require` cache purging

  If you want to manage server changes yourself, you can use the `--no-restart` flag to tell the dev server to refrain from restarting your app server when builds succeed:

  ```sh
  remix dev -c "node ./server.js" --no-restart
  ```

  For example, you could purge the `require` cache of your app server to keep it running while picking up server changes.
  If you do so, you should watch the server build path (`build/` by default) for changes and only purge the `require` cache when changes are detected.

  🚨 If you use `--no-restart`, it is your responsibility to call `broadcastDevReady` when your app server has picked up server changes.
  For example, with `chokidar`:

  ```js
  // server.dev.js
  const BUILD_PATH = path.resolve(__dirname, "build");

  const watcher = chokidar.watch(BUILD_PATH);

  watcher.on("change", () => {
    // 1. purge require cache
    purgeRequireCache();
    // 2. load updated server build
    const build = require(BUILD_PATH);
    // 3. tell dev server that this app server is now ready
    broadcastDevReady(build);
  });
  ```

### Patch Changes

- Fix absolute paths in CSS `url()` rules when using CSS Modules, Vanilla Extract and CSS side-effect imports ([#5788](https://github.com/remix-run/remix/pull/5788))
- look for @remix-run/serve in `devDependencies` when running remix dev ([#6228](https://github.com/remix-run/remix/pull/6228))
- add warning for v2 "cjs"->"esm" `serverModuleFormat` default change ([#6154](https://github.com/remix-run/remix/pull/6154))
- write mjs server output files ([#6225](https://github.com/remix-run/remix/pull/6225))
- fix(react,dev): dev chunking and refresh race condition ([#6201](https://github.com/remix-run/remix/pull/6201))
- Use correct require context in `bareImports` plugin. ([#6181](https://github.com/remix-run/remix/pull/6181))
- use minimatch for regex instead of glob-to-regexp ([#6017](https://github.com/remix-run/remix/pull/6017))
- add `logDevReady` as replacement for platforms that can't initialize async I/O outside of the request response lifecycle. ([#6204](https://github.com/remix-run/remix/pull/6204))
- Use the "automatic" JSX runtime when processing MDX files. ([#6098](https://github.com/remix-run/remix/pull/6098))
- forcibly kill app server during dev ([#6197](https://github.com/remix-run/remix/pull/6197))
- show first compilation error instead of cancelation errors ([#6202](https://github.com/remix-run/remix/pull/6202))
- Resolve imports from route modules across the graph back to the virtual module created by the v2 routes plugin. This fixes issues where we would duplicate portions of route modules that were imported. ([#6098](https://github.com/remix-run/remix/pull/6098))
- Updated dependencies:
  - `@remix-run/server-runtime@1.16.0`

## 1.15.0

### Minor Changes

- Added deprecation warning for `v2_normalizeFormMethod` ([#5863](https://github.com/remix-run/remix/pull/5863))

- Added a new `future.v2_normalizeFormMethod` flag to normalize the exposed `useNavigation().formMethod` as an uppercase HTTP method to align with the previous `useTransition` behavior as well as the `fetch()` behavior of normalizing to uppercase HTTP methods. ([#5815](https://github.com/remix-run/remix/pull/5815))

  - When `future.v2_normalizeFormMethod === false`,
    - `useNavigation().formMethod` is lowercase
    - `useFetcher().formMethod` is uppercase
  - When `future.v2_normalizeFormMethod === true`:
    - `useNavigation().formMethod` is uppercase
    - `useFetcher().formMethod` is uppercase

- Added deprecation warning for `browserBuildDirectory` in `remix.config` ([#5702](https://github.com/remix-run/remix/pull/5702))

- Added deprecation warning for `CatchBoundary` in favor of `future.v2_errorBoundary` ([#5718](https://github.com/remix-run/remix/pull/5718))

- Added experimental support for Vanilla Extract caching, which can be enabled by setting `future.unstable_vanillaExtract: { cache: true }` in `remix.config`. This is considered experimental due to the use of a brand new Vanilla Extract compiler under the hood. In order to use this feature, you must be using at least `v1.10.0` of `@vanilla-extract/css`. ([#5735](https://github.com/remix-run/remix/pull/5735))

- Added deprecation warning for `serverBuildDirectory` in `remix.config` ([#5704](https://github.com/remix-run/remix/pull/5704))

### Patch Changes

- Fixed issue to ensure changes to CSS inserted via `@remix-run/css-bundle` are picked up during HMR ([#5823](https://github.com/remix-run/remix/pull/5823))
- We now use `path.resolve` when re-exporting `entry.client` ([#5707](https://github.com/remix-run/remix/pull/5707))
- Added support for `.mjs` and `.cjs` extensions when detecting CSS side-effect imports ([#5564](https://github.com/remix-run/remix/pull/5564))
- Fixed resolution issues for pnpm users installing `react-refresh` ([#5637](https://github.com/remix-run/remix/pull/5637))
- Added deprecation warning for `future.v2_meta` ([#5878](https://github.com/remix-run/remix/pull/5878))
- Added optional entry file support for React 17 ([#5681](https://github.com/remix-run/remix/pull/5681))
- Updated dependencies:
  - `@remix-run/server-runtime@1.15.0`

## 1.14.3

### Patch Changes

- dev server is resilient to build failures ([#5795](https://github.com/remix-run/remix/pull/5795))
- Updated dependencies:
  - `@remix-run/server-runtime@1.14.3`

## 1.14.2

### Patch Changes

- remove premature deprecation warnings ([#5790](https://github.com/remix-run/remix/pull/5790))
- Updated dependencies:
  - `@remix-run/server-runtime@1.14.2`

## 1.14.1

### Patch Changes

- Add types for importing `*.ico` files ([#5430](https://github.com/remix-run/remix/pull/5430))
- Allow `moduleResolution: "bundler"` in tsconfig.json ([#5576](https://github.com/remix-run/remix/pull/5576))
- Fix issue with x-route imports creating multiple entries in the module graph ([#5721](https://github.com/remix-run/remix/pull/5721))
- Add `serverBuildTarget` deprecation warning ([#5624](https://github.com/remix-run/remix/pull/5624))
- Updated dependencies:
  - `@remix-run/server-runtime@1.14.1`

## 1.14.0

### Minor Changes

- Hot Module Replacement and Hot Data Revalidation ([#5259](https://github.com/remix-run/remix/pull/5259))
  - Requires `unstable_dev` future flag to be enabled
  - HMR provided through React Refresh
  - Features:
    - HMR for component and style changes
    - HDR when loaders for current route change
  - Known limitations for MVP:
    - Only implemented for React via React Refresh
    - No `import.meta.hot` API exposed yet
    - Revalidates _all_ loaders on route when loader changes are detected
    - Loader changes do not account for imported dependencies changing
- Make `entry.client` and `entry.server` files optional ([#4600](https://github.com/remix-run/remix/pull/4600))
  - we'll use a bundled version of each unless you provide your own

### Patch Changes

- Fixes flat route inconsistencies where `route.{ext}` wasn't always being treated like `index.{ext}` when used in a folder ([#5459](https://github.com/remix-run/remix/pull/5459))

  - Route conflict no longer throw errors and instead display a helpful warning that we're using the first one we found.

    ```log
    ⚠️ Route Path Collision: "/dashboard"

    The following routes all define the same URL, only the first one will be used

    🟢️️ routes/dashboard/route.tsx
    ⭕️️ routes/dashboard.tsx
    ```

    ```log
    ⚠️ Route Path Collision: "/"

    The following routes all define the same URL, only the first one will be used

    🟢️️ routes/_landing._index.tsx
    ⭕️️ routes/_dashboard._index.tsx
    ⭕️ routes/_index.tsx
    ```

- Log errors thrown during initial build in development. ([#5441](https://github.com/remix-run/remix/pull/5441))

- Sync `FutureConfig` interface between packages ([#5398](https://github.com/remix-run/remix/pull/5398))

- Add file loader for importing `.csv` files ([#3920](https://github.com/remix-run/remix/pull/3920))

- Updated dependencies:
  - `@remix-run/server-runtime@1.14.0`

## 1.13.0

### Minor Changes

- We are deprecating `serverBuildTarget` in `remix.config`. See the [release notes for v1.13.0](https://github.com/remix-run/remix/releases/tag/remix%401.13.0) for more information. ([#5354](https://github.com/remix-run/remix/pull/5354))
- Add built-in support for PostCSS via the `future.unstable_postcss` feature flag ([#5229](https://github.com/remix-run/remix/pull/5229))
- Add built-in support for Tailwind via the `future.unstable_tailwind` feature flag ([#5229](https://github.com/remix-run/remix/pull/5229))

### Patch Changes

- Mark Vanilla Extract files as side effects to ensure that files only containing global styles aren't tree-shaken ([#5246](https://github.com/remix-run/remix/pull/5246))
- Support decorators in files using CSS side-effect imports ([#5305](https://github.com/remix-run/remix/pull/5305))
- We made several Flat route fixes and enhancements. See the [release notes for v1.13.0](https://github.com/remix-run/remix/releases/tag/remix%401.13.0) for more information. ([#5228](https://github.com/remix-run/remix/pull/5228))
- Updated dependencies:
  - `@remix-run/server-runtime@1.13.0`

## 1.12.0

### Minor Changes

- Added a new development server available in the Remix config under the `unstable_dev` flag. [See the release notes](https://github.com/remix-run/remix/releases/tag/remix%401.12.0) for a full description. ([#5133](https://github.com/remix-run/remix/pull/5133))

### Patch Changes

- Fixed issues with `v2_routeConvention` on Windows so that new and renamed files are properly included ([#5266](https://github.com/remix-run/remix/pull/5266))
- Server build should not be removed in `remix watch` and `remix dev` ([#5228](https://github.com/remix-run/remix/pull/5228))
- The dev server will now clean up build directories whenever a rebuild starts ([#5223](https://github.com/remix-run/remix/pull/5223))
- Updated dependencies:
  - `@remix-run/server-runtime@1.12.0`

## 1.11.1

### Patch Changes

- Fixed a bug with `v2_routeConvention` that prevented `index` modules from being recognized for route paths ([`195291a3d`](https://github.com/remix-run/remix/commit/195291a3d8c0e098931199bcc26277a45cee0eb9))
- Updated dependencies:
  - `@remix-run/server-runtime@1.11.1`

## 1.11.0

### Minor Changes

- Specify file loader for `.fbx`, `.glb`, `.gltf`, `.hdr`, and `.mov` files ([#5030](https://github.com/remix-run/remix/pull/5030))
- Added support for [Vanilla Extract](https://vanilla-extract.style) via the `unstable_vanillaExtract` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#5040](https://github.com/remix-run/remix/pull/5040))
- Add support for CSS side-effect imports via the `unstable_cssSideEffectImports` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#4919](https://github.com/remix-run/remix/pull/4919))
- Add support for CSS Modules via the `unstable_cssModules` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#4852](https://github.com/remix-run/remix/pull/4852))

### Patch Changes

- Add new "flat" routing conventions. This convention will be the default in v2 but is available now under the `v2_routeConvention` future flag. ([#4880](https://github.com/remix-run/remix/pull/4880))
- Added support for `handle` in MDX frontmatter ([#4865](https://github.com/remix-run/remix/pull/4865))
- Updated dependencies:
  - `@remix-run/server-runtime@1.11.0`

## 1.10.1

### Patch Changes

- Update babel config to transpile down to node 14 ([#5047](https://github.com/remix-run/remix/pull/5047))
- Updated dependencies:
  - `@remix-run/server-runtime@1.10.1`

## 1.10.0

### Patch Changes

- Fixed several issues with TypeScript to JavaScript conversion when running `create-remix` ([#4891](https://github.com/remix-run/remix/pull/4891))
- Resolve asset entry full path to support monorepo import of styles ([#4855](https://github.com/remix-run/remix/pull/4855))
- Updated dependencies:
  - `@remix-run/server-runtime@1.10.0`

## 1.9.0

### Minor Changes

- Allow defining multiple routes for the same route module file ([#3970](https://github.com/remix-run/remix/pull/3970))
- Added support and conventions for optional route segments ([#4706](https://github.com/remix-run/remix/pull/4706))

### Patch Changes

- The Remix compiler now supports new Typescript 4.9 syntax (like the `satisfies` keyword) ([#4754](https://github.com/remix-run/remix/pull/4754))
- Optimize `parentRouteId` lookup in `defineConventionalRoutes`. ([#4800](https://github.com/remix-run/remix/pull/4800))
- Fixed a bug in `.ts` -> `.js` conversion on Windows by using a relative unix-style path ([#4718](https://github.com/remix-run/remix/pull/4718))
- Updated dependencies:
  - `@remix-run/server-runtime@1.9.0`

## 1.8.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.8.2`
  - `@remix-run/serve@1.8.2`

## 1.8.1

### Patch Changes

- Added a missing type definition for the Remix config `future` option to the `@remix-run/dev/server-build` virtual module ([#4771](https://github.com/remix-run/remix/pull/4771))
- Updated dependencies:
  - `@remix-run/serve@1.8.1`
  - `@remix-run/server-runtime@1.8.1`

## 1.8.0

### Minor Changes

- Added support for a new route `meta` API to handle arrays of tags instead of an object. For details, check out the [RFC](https://github.com/remix-run/remix/discussions/4462). ([#4610](https://github.com/remix-run/remix/pull/4610))

### Patch Changes

- Importing functions and types from the `remix` package is deprecated, and all exported modules will be removed in the next major release. For more details,[see the release notes for 1.4.0](https://github.com/remix-run/remix/releases/tag/v1.4.0) where these changes were first announced. ([#4661](https://github.com/remix-run/remix/pull/4661))
- Updated dependencies:
  - `@remix-run/server-runtime@1.8.0`
  - `@remix-run/serve@1.8.0`

## 1.7.6

### Patch Changes

- Updated dependencies:
  - `@remix-run/serve@1.7.6`
  - `@remix-run/server-runtime@1.7.6`

### Patch Changes

- Updated dependencies:
  - `@remix-run/serve@1.7.6-pre.0`
  - `@remix-run/server-runtime@1.7.6-pre.0`

## 1.7.5

### Patch Changes

- Updated dependencies:
  - `@remix-run/serve@1.7.5`
  - `@remix-run/server-runtime@1.7.5`

## 1.7.4

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.7.4`
  - `@remix-run/serve@1.7.4`

## 1.7.3

### Patch Changes

- Update `create-remix` to use the new examples repository when using `--template example/<name>` ([#4208](https://github.com/remix-run/remix/pull/4208))
- Add support for setting `moduleResolution` to `node`, `node16` or `nodenext` in `tsconfig.json`. ([#4034](https://github.com/remix-run/remix/pull/4034))
- Add resources imported only by resource routes to `assetsBuildDirectory` ([#3841](https://github.com/remix-run/remix/pull/3841))
- Ensure that any assets referenced in CSS files are hashed and copied to the `assetsBuildDirectory`. ([#4130](https://github.com/remix-run/remix/pull/4130))
- Updated dependencies:
  - `@remix-run/serve@1.7.3`
  - `@remix-run/server-runtime@1.7.3`

## 1.7.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.7.2`
  - `@remix-run/serve@1.7.2`

## 1.7.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.7.1`
  - `@remix-run/serve@1.7.1`

## 1.7.0

### Minor Changes

- Added support for importing `.gql` and `.graphql` files as plain text ([#3923](https://github.com/remix-run/remix/pull/3923))
- Added support for importing `.zip` and `.avif` files as resource URLs ([#3985](https://github.com/remix-run/remix/pull/3985))

### Patch Changes

- Removed our compiler's React shim in favor of esbuild's new automatic JSX transform ([#3860](https://github.com/remix-run/remix/pull/3860))
- Updated dependencies:
  - `@remix-run/server-runtime@1.7.0`
  - `@remix-run/serve@1.7.0`

## 1.6.8

### Patch Changes

- Added support for `.mjs` and `.cjs` file extensions for `remix.config` ([#3675](https://github.com/remix-run/remix/pull/3675))
- Added support for importing `.sql` files as text content ([#3190](https://github.com/remix-run/remix/pull/3190))
- Updated the compiler to make MDX builds deterministic (and a little faster!) ([#3966](https://github.com/remix-run/remix/pull/3966))
- Updated dependencies:
  - `@remix-run/server-runtime@1.6.8`
  - `@remix-run/serve@1.6.8`

## 1.6.7

### Patch Changes

- Remove logical nullish assignment, which is incompatible with Node v14. ([#3880](https://github.com/remix-run/remix/pull/3880))
- Don't show ESM warnings when consumed via dynamic import. ([#3872](https://github.com/remix-run/remix/pull/3872))
- Updated dependencies:
  - `@remix-run/serve@1.6.7`
  - `@remix-run/server-runtime@1.6.7`

## 1.6.6

### Patch Changes

- Write server build output files so that only assets imported from resource routes are written to disk ([#3817](https://github.com/remix-run/remix/pull/3817))
- Add support for exporting links in `.mdx` files ([#3801](https://github.com/remix-run/remix/pull/3801))
- Ensure that build hashing is deterministic ([#2027](https://github.com/remix-run/remix/pull/2027))
- Fix types for `@remix-run/dev/server-build` virtual module ([#3743](https://github.com/remix-run/remix/pull/3743))
- Updated dependencies:
  - `@remix-run/serve@1.6.6`
  - `@remix-run/server-runtime@1.6.6`

## 1.6.5

### Patch Changes

- Update `serverBareModulesPlugin` warning to use full import path ([#3656](https://github.com/remix-run/remix/pull/3656))
- Fix broken `--port` flag in `create-remix` ([#3694](https://github.com/remix-run/remix/pull/3694))
- Updated dependencies
  - `@remix-run/server-runtime`
  - `@remix-run/serve`
