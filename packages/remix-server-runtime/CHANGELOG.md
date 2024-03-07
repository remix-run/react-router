# `@remix-run/server-runtime`

## 2.8.1

No significant changes to this package were made in this release. [See the repo `CHANGELOG.md`](https://github.com/remix-run/remix/blob/main/CHANGELOG.md) for an overview of all changes in v2.8.1.

## 2.8.0

No significant changes to this package were made in this release. [See the repo `CHANGELOG.md`](https://github.com/remix-run/remix/blob/main/CHANGELOG.md) for an overview of all changes in v2.8.0.

## 2.7.2

No significant changes to this package were made in this release. [See the repo `CHANGELOG.md`](https://github.com/remix-run/remix/blob/main/CHANGELOG.md) for an overview of all changes in v2.7.2.

## 2.7.1

No significant changes to this package were made in this release. [See the repo `CHANGELOG.md`](https://github.com/remix-run/remix/blob/main/CHANGELOG.md) for an overview of all changes in v2.7.1.

## 2.7.0

### Minor Changes

- Allow an optional `Layout` export from the root route ([#8709](https://github.com/remix-run/remix/pull/8709))
- Vite: Add a new `basename` option to the Vite plugin, allowing users to set the internal React Router [`basename`](https://reactrouter.com/en/main/routers/create-browser-router#basename) in order to to serve their applications underneath a subpath ([#8145](https://github.com/remix-run/remix/pull/8145))

### Patch Changes

- Add a more specific error if a user returns a `defer` response from a resource route ([#8726](https://github.com/remix-run/remix/pull/8726))

## 2.6.0

### Minor Changes

- Add `future.v3_throwAbortReason` flag to throw `request.signal.reason` when a request is aborted instead of an `Error` such as `new Error("query() call aborted: GET /path")` ([#8251](https://github.com/remix-run/remix/pull/8251))

### Patch Changes

- Vite: Cloudflare Pages support ([#8531](https://github.com/remix-run/remix/pull/8531))

  To get started with Cloudflare, you can use the \[`unstable-vite-cloudflare`]\[template-vite-cloudflare] template:

  ```shellscript nonumber
  npx create-remix@latest --template remix-run/remix/templates/unstable-vite-cloudflare
  ```

  Or read the new docs at [Future > Vite > Cloudflare](https://remix.run/docs/en/main/future/vite#cloudflare) and
  [Future > Vite > Migrating > Migrating Cloudflare Functions](https://remix.run/docs/en/main/future/vite#migrating-cloudflare-functions).

- Unwrap thrown `Response`'s from `entry.server` into `ErrorResponse`'s and preserve the status code ([#8577](https://github.com/remix-run/remix/pull/8577))

## 2.5.1

No significant changes to this package were made in this release. [See the repo `CHANGELOG.md`](https://github.com/remix-run/remix/blob/main/CHANGELOG.md) for an overview of all changes in v2.5.1.

## 2.5.0

### Minor Changes

- Updated `cookie` dependency to [`0.6.0`](https://github.com/jshttp/cookie/blob/master/HISTORY.md#060--2023-11-06) to inherit support for the [`Partitioned`](https://developer.mozilla.org/en-US/docs/Web/Privacy/Partitioned_cookies) attribute ([#8375](https://github.com/remix-run/remix/pull/8375))
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

## 2.4.1

### Patch Changes

- Add optional `error` to `ServerRuntimeMetaArgs` type to align with `MetaArgs` ([#8238](https://github.com/remix-run/remix/pull/8238))

## 2.4.0

### Minor Changes

- Add support for `clientLoader`/`clientAction`/`HydrateFallback` route exports ([RFC](https://github.com/remix-run/remix/discussions/7634)). ([#8173](https://github.com/remix-run/remix/pull/8173))

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

- Deprecate `DataFunctionArgs` in favor of `LoaderFunctionArgs`/`ActionFunctionArgs`. This is aimed at keeping the types aligned across server/client loaders/actions now that `clientLoader`/`clientActon` functions have `serverLoader`/`serverAction` parameters which differentiate `ClientLoaderFunctionArgs`/`ClientActionFunctionArgs`. ([#8173](https://github.com/remix-run/remix/pull/8173))

- Add a new `future.v3_relativeSplatPath` flag to implement a breaking bug fix to relative routing when inside a splat route. For more information, please see the React Router [`6.21.0` Release Notes](https://github.com/remix-run/react-router/blob/release-next/CHANGELOG.md#futurev7_relativesplatpath) and the [`useResolvedPath` docs](https://remix.run/hooks/use-resolved-path#splat-paths). ([#8216](https://github.com/remix-run/remix/pull/8216))

### Patch Changes

- Fix flash of unstyled content for non-Express custom servers in Vite dev ([#8076](https://github.com/remix-run/remix/pull/8076))
- Pass request handler errors to `vite.ssrFixStacktrace` in Vite dev to ensure stack traces correctly map to the original source code ([#8066](https://github.com/remix-run/remix/pull/8066))

## 2.3.1

No significant changes to this package were made in this release. [See the repo `CHANGELOG.md`](https://github.com/remix-run/remix/blob/main/CHANGELOG.md) for an overview of all changes in v2.3.1.

## 2.3.0

### Minor Changes

- Updated `cookie` dependency from `0.4.1` to [`0.5.0`](https://github.com/jshttp/cookie/blob/v0.5.0/HISTORY.md#050--2022-04-11) to inherit support for `Priority` attribute in Chrome ([#6770](https://github.com/remix-run/remix/pull/6770))

## 2.2.0

### Minor Changes

- Unstable Vite support for Node-based Remix apps ([#7590](https://github.com/remix-run/remix/pull/7590))
  - `remix build` 👉 `vite build && vite build --ssr`
  - `remix dev` 👉 `vite dev`
  - Other runtimes (e.g. Deno, Cloudflare) not yet supported.
  - See "Future > Vite" in the Remix Docs for details

## 2.1.0

### Patch Changes

- Emulate types for `JSON.parse(JSON.stringify(x))` in `SerializeFrom` ([#7605](https://github.com/remix-run/remix/pull/7605))
  - Notably, type fields that are only assignable to `undefined` after serialization are now omitted since `JSON.stringify |> JSON.parse` will omit them -- see test cases for examples
  - Also fixes type errors when upgrading to v2 from 1.19

## 2.0.1

No significant changes to this package were made in this release. [See the releases page on GitHub](https://github.com/remix-run/remix/releases/tag/remix%402.0.1) for an overview of all changes in v2.0.1.

## 2.0.0

### Major Changes

- Require Node >=18.0.0 ([#6939](https://github.com/remix-run/remix/pull/6939))
- The route `meta` API now defaults to the new "V2 Meta" API ([#6958](https://github.com/remix-run/remix/pull/6958))
  - Please refer to the ([docs](https://remix.run/docs/en/2.0.0/route/meta) and [Preparing for V2](https://remix.run/docs/en/2.0.0/start/v2#route-meta) guide for more information.
- Promote the `future.v2_dev` flag in `remix.config.js` to a root level `dev` config ([#7002](https://github.com/remix-run/remix/pull/7002))
- Remove `v2_errorBoundary` flag and `CatchBoundary` implementation ([#6906](https://github.com/remix-run/remix/pull/6906))
- Remove `v2_normalizeFormMethod` future flag - all `formMethod` values will be normalized in v2 ([#6875](https://github.com/remix-run/remix/pull/6875))
- Remove `v2_routeConvention` flag - the flat route file convention is now standard ([#6969](https://github.com/remix-run/remix/pull/6969))
- Remove `v2_headers` flag - it is now the default behavior to use the deepest `headers` function in the route tree ([#6979](https://github.com/remix-run/remix/pull/6979))
- Remove `imagesizes` & `imagesrcset` properties from `HtmlLinkDescriptor`, `LinkDescriptor` & `PrefetchPageDescriptor` types ([#6936](https://github.com/remix-run/remix/pull/6936))
- Removed/adjusted types to prefer `unknown` over `any` and to align with underlying React Router types ([#7319](https://github.com/remix-run/remix/pull/7319), [#7354](https://github.com/remix-run/remix/pull/7354)):
  - Renamed the `useMatches()` return type from `RouteMatch` to `UIMatch`
  - Renamed `LoaderArgs`/`ActionArgs` to `LoaderFunctionArgs`/`ActionFunctionArgs`
  - `AppData` changed from `any` to `unknown`
  - `Location["state"]` (`useLocation.state`) changed from `any` to `unknown`
  - `UIMatch["data"]` (`useMatches()[i].data`) changed from `any` to `unknown`
  - `UIMatch["handle"]` (`useMatches()[i].handle`) changed from `{ [k: string]: any }` to `unknown`
  - `Fetcher["data"]` (`useFetcher().data`) changed from `any` to `unknown`
  - `MetaMatch.handle` (used in `meta()`) changed from `any` to `unknown`
  - `AppData`/`RouteHandle` are no longer exported as they are just aliases for `unknown`
- Remove deprecated `REMIX_DEV_HTTP_ORIGIN` env var - use `REMIX_DEV_ORIGIN` instead ([#6963](https://github.com/remix-run/remix/pull/6963))
- Removed support for "magic exports" from the `remix` package. This package can be removed from your `package.json` and you should update all imports to use the source `@remix-run/*` packages: ([#6895](https://github.com/remix-run/remix/pull/6895))

  ```diff
  - import type { ActionArgs } from "remix";
  - import { json, useLoaderData } from "remix";
  + import type { ActionArgs } from "@remix-run/node";
  + import { json } from "@remix-run/node";
  + import { useLoaderData } from "@remix-run/react";
  ```

### Minor Changes

- Update Remix to use React Router `route.lazy` for module loading ([#7133](https://github.com/remix-run/remix/pull/7133))
- Detect built mode via `build.mode` ([#6964](https://github.com/remix-run/remix/pull/6964))
  - Prevents mode mismatch between built Remix server entry and user-land server
  - Additionally, all runtimes (including non-Node runtimes) can use `build.mode` to determine if HMR should be performed.
- Re-export the new `redirectDocument` method from React Router ([#7040](https://github.com/remix-run/remix/pull/7040), [#6842](https://github.com/remix-run/remix/pull/6842)) ([#7040](https://github.com/remix-run/remix/pull/7040))

### Patch Changes

- Export proper `ErrorResponse` type for usage alongside `isRouteErrorResponse` ([#7244](https://github.com/remix-run/remix/pull/7244))
- Fix `destroySession` for sessions using a `maxAge` cookie ([#7252](https://github.com/remix-run/remix/pull/7252))
  - The data in the cookie was always properly destroyed but when using `maxAge`, the cookie itself wasn't deleted because `Max-Age` takes precedence over `Expires` in the cookie spec
- Ensure `maxAge`/`expires` options passed to `commitSession` take precedence over the original `cookie.expires` value ([#6598](https://github.com/remix-run/remix/pull/6598), [#7374](https://github.com/remix-run/remix/pull/7374))
- Fix `handleError` method to correctly receive `ErrorResponse` instances on `?_data` and resource route requests ([#7211](https://github.com/remix-run/remix/pull/7211))
  - It now receives the `ErrorResponse` instance the same way a document request would
  - Users can leverage `isRouteErrorResponse` to detect these error instances and log accordingly
- Update `createMemorySessionStorage` to use an internal hash value instead of an integer for the session `id` ([#7227](https://github.com/remix-run/remix/pull/7227))
- Fix false-positive resource route classification on document requests for routes that only export an `ErrorBoundary` ([#7155](https://github.com/remix-run/remix/pull/7155))
- Correctly infer deferred types for top-level promises ([#7104](https://github.com/remix-run/remix/pull/7104))
- Construct `Request` with `duplex` option ([#7234](https://github.com/remix-run/remix/pull/7234))
- Updated dependencies:
  - [`react-router-dom@6.16.0`](https://github.com/remix-run/react-router/releases/tag/react-router%406.16.0)
  - [`@remix-run/router@1.9.0`](https://github.com/remix-run/react-router/blob/main/packages/router/CHANGELOG.md#190)

## 1.19.3

No significant changes to this package were made in this release. [See the releases page on GitHub](https://github.com/remix-run/remix/releases/tag/remix%401.19.3) for an overview of all changes in v1.19.3.

## 1.19.2

### Patch Changes

- Update to latest `@remix-run/web-*` packages ([#7026](https://github.com/remix-run/remix/pull/7026))

## 1.19.1

No significant changes to this package were made in this release. [See the releases page on GitHub](https://github.com/remix-run/remix/releases/tag/remix%401.19.1) for an overview of all changes in v1.19.1.

## 1.19.0

### Minor Changes

- improved networking options for `v2_dev` ([#6724](https://github.com/remix-run/remix/pull/6724))

  deprecate the `--scheme` and `--host` options and replace them with the `REMIX_DEV_ORIGIN` environment variable

### Patch Changes

- Properly handle `?_data` HTTP/Network errors that don't reach the Remix server and ensure they bubble to the `ErrorBoundary` ([#6783](https://github.com/remix-run/remix/pull/6783))
- Support proper hydration of `Error` subclasses such as `ReferenceError`/`TypeError` in development mode ([#6675](https://github.com/remix-run/remix/pull/6675))
- Properly return a 404 for a `?_data` request that doesn't match routes ([#6820](https://github.com/remix-run/remix/pull/6820))
- Bump RR 6.14.2 ([#6854](https://github.com/remix-run/remix/pull/6854))
- Updated dependencies:
  - [`@remix-run/router@1.7.2`](https://github.com/remix-run/react-router/blob/main/packages/router/CHANGELOG.md#172)

## 1.18.1

### Patch Changes

- Fix reload loops in scenarios where CDNs ignore search params ([#6707](https://github.com/remix-run/remix/pull/6707))
- Avoid circular references and infinite recursion in types ([#6736](https://github.com/remix-run/remix/pull/6736))
  - "Pretty" or simplified Typescript types are evaluated by eagerly resolving types. For complex types with circular references, this can cause TS to recurse infinitely.
  - To fix this, pretty types are reverted as a built-in DX feature of `useLoaderData`, `useActionData`, etc...
- Updated dependencies:
  - [`@remix-run/router@1.7.1`](https://github.com/remix-run/react-router/blob/main/packages/router/CHANGELOG.md#171)

## 1.18.0

### Minor Changes

- stabilize v2 dev server ([#6615](https://github.com/remix-run/remix/pull/6615))

### Patch Changes

- Fix typing issues when using React 17 stemming from `@remix/server-runtime` including `@types/react` as a `devDependency` when it doesn't actually do anything React-specific and was just re-exporting `ComponentType` in values such as `CatchBoundaryComponent`/`ErrorBoundaryComponent`/`V2_ErrorBoundaryComponent`. These types are more correctly exported from `@remix-run/react` which is React-aware so that is the correct place to be importing those types from. In order to avoid breaking existing builds, the types in `@remix/server-runtime` have been loosened to `any` and `@deprecated` warnings have been added informing users to switch to the corresponding types in `@remix-run/react`. ([#5713](https://github.com/remix-run/remix/pull/5713))
- fix(types): better tuple serialization types ([#6616](https://github.com/remix-run/remix/pull/6616))
- Move `@types/cookie` to `dependencies` since we re-export types from there ([#5713](https://github.com/remix-run/remix/pull/5713))

## 1.17.1

No significant changes to this package were made in this release. [See the releases page on GitHub](https://github.com/remix-run/remix/releases/tag/remix%401.17.1) for an overview of all changes in v1.17.1.

## 1.17.0

### Minor Changes

- Add `errorHeaders` parameter to the leaf `headers()` function to expose headers from thrown responses that bubble up to ancestor route boundaries. If the throwing route contains the boundary, then `errorHeaders` will be the same object as `loaderHeaders`/`actionHeaders` for that route. ([#6425](https://github.com/remix-run/remix/pull/6425), [#6475](https://github.com/remix-run/remix/pull/6475))

- Add optional `handleError` export for custom server-side error processing. This is a new optional export from your `entry.server.tsx` that will be called with any encountered error on the Remix server (loader, action, or render error) ([#6495](https://github.com/remix-run/remix/pull/6495), [#6524](https://github.com/remix-run/remix/pull/6524)):

  ```ts
  // entry.server.tsx
  export function handleError(
    error: unknown,
    { request, params, context }: DataFunctionArgs
  ): void {
    if (error instanceof Error) {
      sendErrorToBugReportingService(error);
      console.error(formatError(error));
    } else {
      const unknownError = new Error("Unknown Server Error");
      sendErrorToBugReportingService(unknownError);
      console.error(unknownError);
    }
  }
  ```

- Force Typescript to simplify type produced by `Serialize`. ([#6449](https://github.com/remix-run/remix/pull/6449))

  As a result, the following types and functions have simplified return types:

  - SerializeFrom
  - useLoaderData
  - useActionData
  - useFetcher

  ```ts
  type Data = { hello: string; when: Date };

  // BEFORE
  type Unsimplified = SerializeFrom<Data>;
  //   ^? SerializeObject<UndefinedToOptional<{ hello: string; when: Date }>>

  // AFTER
  type Simplified = SerializeFrom<Data>;
  //   ^? { hello: string; when: string }
  ```

- Added a new `future.v2_headers` future flag to opt into automatic inheriting of ancestor route `headers` functions so you do not need to export a `headers` function from every possible leaf route if you don't wish to. ([#6431](https://github.com/remix-run/remix/pull/6431))

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

- Properly handle thrown `ErrorResponse` instances inside resource routes ([#6320](https://github.com/remix-run/remix/pull/6320))

- Add `HeadersArgs` type to be consistent with loaders/actions/meta and allows for using a `function` declaration in addition to an arrow function expression ([#6247](https://github.com/remix-run/remix/pull/6247))

  ```tsx
  import type { HeadersArgs } from "@remix-run/node"; // or cloudflare/deno

  export function headers({ loaderHeaders }: HeadersArgs) {
    return {
      "x-my-custom-thing": loaderHeaders.get("x-my-custom-thing") || "fallback",
    };
  }
  ```

- Ensure un-sanitized server errors are logged on the server during document requests ([#6495](https://github.com/remix-run/remix/pull/6495))

- Updated dependencies:
  - [`react-router-dom@6.12.0`](https://github.com/remix-run/react-router/releases/tag/react-router%406.12.0)
  - [`@remix-run/router@1.6.3`](https://github.com/remix-run/react-router/blob/main/packages/router/CHANGELOG.md#163)

## 1.16.1

### Patch Changes

- Expose methods in the `SessionStorage` interface as arrow functions so destructuring is correctly part of the contract. ([#6330](https://github.com/remix-run/remix/pull/6330))
- Fix `data` parameter typing on `V2_MetaFunction` to include `undefined` for scenarios in which the `loader` threw to it's own boundary. ([#6231](https://github.com/remix-run/remix/pull/6231))
- Updated dependencies:
  - [`react-router-dom@6.11.2`](https://github.com/remix-run/react-router/releases/tag/react-router%406.11.2)
  - [`@remix-run/router@1.6.2`](https://github.com/remix-run/react-router/blob/main/packages/router/CHANGELOG.md#162)

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
  // eslint-disable-next-line no-restricted-globals
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

- add `logDevReady` as replacement for platforms that can't initialize async I/O outside of the request response lifecycle. ([#6204](https://github.com/remix-run/remix/pull/6204))
- better type discrimination when unwrapping loader return types ([#5516](https://github.com/remix-run/remix/pull/5516))
- pass `AppLoadContext` to `handleRequest` ([#5836](https://github.com/remix-run/remix/pull/5836))
- Updated dependencies:
  - [`react-router-dom@6.11.0`](https://github.com/remix-run/react-router/releases/tag/react-router%406.11.0)
  - [`@remix-run/router@1.6.0`](https://github.com/remix-run/react-router/blob/main/packages/router/CHANGELOG.md#160)

## 1.15.0

### Minor Changes

- We have made a few changes to the API for route module `meta` functions when using the `future.v2_meta` flag. **These changes are _only_ breaking for users who have opted in.** ([#5746](https://github.com/remix-run/remix/pull/5746))

  - `V2_HtmlMetaDescriptor` has been renamed to `V2_MetaDescriptor`
  - The `meta` function's arguments have been simplified
    - `parentsData` has been removed, as each route's loader data is available on the `data` property of its respective `match` object
      ```tsx
      // before
      export function meta({ parentsData }) {
        return [{ title: parentsData["routes/some-route"].title }];
      }
      // after
      export function meta({ matches }) {
        return [
          {
            title: matches.find((match) => match.id === "routes/some-route")
              .data.title,
          },
        ];
      }
      ```
    - The `route` property on route matches has been removed, as relevant match data is attached directly to the match object
      ```tsx
      // before
      export function meta({ matches }) {
        const rootModule = matches.find((match) => match.route.id === "root");
      }
      // after
      export function meta({ matches }) {
        const rootModule = matches.find((match) => match.id === "root");
      }
      ```
  - Added support for generating `<script type='application/ld+json' />` and meta-related `<link />` tags to document head via the route `meta` function when using the `v2_meta` future flag

- Added a new `future.v2_normalizeFormMethod` flag to normalize the exposed `useNavigation().formMethod` as an uppercase HTTP method to align with the previous `useTransition` behavior as well as the `fetch()` behavior of normalizing to uppercase HTTP methods. ([#5815](https://github.com/remix-run/remix/pull/5815))

  - When `future.v2_normalizeFormMethod === false`,
    - `useNavigation().formMethod` is lowercase
    - `useFetcher().formMethod` is uppercase
  - When `future.v2_normalizeFormMethod === true`:
    - `useNavigation().formMethod` is uppercase
    - `useFetcher().formMethod` is uppercase

- Added deprecation warning for `CatchBoundary` in favor of `future.v2_errorBoundary` ([#5718](https://github.com/remix-run/remix/pull/5718))

- Added experimental support for Vanilla Extract caching, which can be enabled by setting `future.unstable_vanillaExtract: { cache: true }` in `remix.config`. This is considered experimental due to the use of a brand new Vanilla Extract compiler under the hood. In order to use this feature, you must be using at least `v1.10.0` of `@vanilla-extract/css`. ([#5735](https://github.com/remix-run/remix/pull/5735))

### Patch Changes

- Bumped React Router dependencies to the latest version. [See the release notes for more details.](https://github.com/remix-run/react-router/releases/tag/react-router%406.10.0) ([`e14699547`](https://github.com/remix-run/remix/commit/e1469954737a2e45636b6aef73dc9ae251fb1b20))
- Added type deprecations for types now in React Router ([#5679](https://github.com/remix-run/remix/pull/5679))
- Stopped logging server errors for aborted requests ([#5602](https://github.com/remix-run/remix/pull/5602))
- We now ensure that stack traces are removed from all server side errors in production ([#5541](https://github.com/remix-run/remix/pull/5541))

## 1.14.3

No significant changes to this package were made in this release. [See the releases page on GitHub](https://github.com/remix-run/remix/releases/tag/remix%401.14.2) for an overview of all changes in v1.14.3.

## 1.14.2

No significant changes to this package were made in this release. [See the releases page on GitHub](https://github.com/remix-run/remix/releases/tag/remix%401.14.2) for an overview of all changes in v1.14.2.

## 1.14.1

No significant changes to this package were made in this release. [See the releases page on GitHub](https://github.com/remix-run/remix/releases/tag/remix%401.14.1) for an overview of all changes in v1.14.1.

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

### Patch Changes

- Sync `FutureConfig` interface between packages ([#5398](https://github.com/remix-run/remix/pull/5398))
- Updated dependencies:
  - `@remix-run/router@1.3.3`
  - `react-router-dom@8.6.2`

## 1.13.0

### Minor Changes

- Add built-in support for PostCSS via the `future.unstable_postcss` feature flag ([#5229](https://github.com/remix-run/remix/pull/5229))
- Add built-in support for Tailwind via the `future.unstable_tailwind` feature flag ([#5229](https://github.com/remix-run/remix/pull/5229))

### Patch Changes

- Bump React Router dependencies to the latest version. [See the release notes for more details.](https://github.com/remix-run/react-router/releases/tag/react-router%406.8.1) ([#5389](https://github.com/remix-run/remix/pull/5389))
- Improve efficiency of route manifest-to-tree transformation ([#4748](https://github.com/remix-run/remix/pull/4748))

## 1.12.0

### Minor Changes

- Added a new development server available in the Remix config under the `unstable_dev` flag. [See the release notes](https://github.com/remix-run/remix/releases/tag/remix%401.12.0) for a full description. ([#5133](https://github.com/remix-run/remix/pull/5133))
- Removed `react` & `react-dom` from `peerDependencies` ([#4801](https://github.com/remix-run/remix/pull/4801))

### Patch Changes

- Bump React Router dependencies to the latest version. [See the release notes for more details.](https://github.com/remix-run/react-router/releases/tag/react-router%406.8.0) ([#5242](https://github.com/remix-run/remix/pull/5242))

## 1.11.1

No significant changes to this package were made in this release. [See the releases page on GitHub](https://github.com/remix-run/remix/releases/tag/remix%401.11.1) for an overview of all changes in v1.11.1.

## 1.11.0

### Minor Changes

- Added support for [Vanilla Extract](https://vanilla-extract.style) via the `unstable_vanillaExtract` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#5040](https://github.com/remix-run/remix/pull/5040))
- Add support for CSS side-effect imports via the `unstable_cssSideEffectImports` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#4919](https://github.com/remix-run/remix/pull/4919))
- Add support for CSS Modules via the `unstable_cssModules` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#4852](https://github.com/remix-run/remix/pull/4852))

### Patch Changes

- Added the `v2_errorBoundary` future flag to opt into the next version of Remix's `ErrorBoundary` behavior. This removes the separate `CatchBoundary` and `ErrorBoundary` and consolidates them into a single `ErrorBoundary`, following the logic used by `errorElement` in React Router. You can then use `isRouteErrorResponse` to differentiate between thrown `Response`/`Error` instances. ([#4918](https://github.com/remix-run/remix/pull/4918))

  ```tsx
  // Current (Remix v1 default)
  import { useCatch } from "@remix-run/react";

  export function CatchBoundary() {
    const caught = useCatch();
    return (
      <p>
        {caught.status} {caught.data}
      </p>
    );
  }

  export function ErrorBoundary({ error }) {
    return <p>{error.message}</p>;
  }
  ```

  ```tsx
  // Using future.v2_errorBoundary
  import { isRouteErrorResponse, useRouteError } from "@remix-run/react";

  export function ErrorBoundary() {
    const error = useRouteError();

    return isRouteErrorResponse(error) ? (
      <p>
        {error.status} {error.data}
      </p>
    ) : (
      <p>{error.message}</p>
    );
  }
  ```

- Introduces the `defer()` API from `@remix-run/router` with support for server-rendering and HTTP streaming. This utility allows you to defer values returned from `loader` functions by returning promises instead of resolved values. This has been refered to as _"sending a promise over the wire"_. ([#4920](https://github.com/remix-run/remix/pull/4920))

  Informational Resources:

  - <https://gist.github.com/jacob-ebey/9bde9546c1aafaa6bc8c242054b1be26>
  - <https://github.com/remix-run/remix/blob/main/decisions/0004-streaming-apis.md>

  Documentation Resources (better docs specific to Remix are in the works):

  - <https://reactrouter.com/en/main/utils/defer>
  - <https://reactrouter.com/en/main/components/await>
  - <https://reactrouter.com/en/main/hooks/use-async-value>
  - <https://reactrouter.com/en/main/hooks/use-async-error>

## 1.10.1

No significant changes to this package were made in this release. [See the releases page on GitHub](https://github.com/remix-run/remix/releases/tag/remix%401.10.1) for an overview of all changes in v1.10.1.

## 1.10.0

### Minor Changes

- Update Remix to use new data APIs introduced in React Router v6.4 ([#4900](https://github.com/remix-run/remix/pull/4900))

### Patch Changes

- Export `V2_HtmlMetaDescriptor` and `V2_MetaFunction` types from runtime packages ([#4943](https://github.com/remix-run/remix/pull/4943))
- Fix `V2_MetaFunction` to return `V2_HtmlMetaDescriptor[]` type ([#4947](https://github.com/remix-run/remix/pull/4947))

## 1.9.0

### Patch Changes

- Fix `TypedResponse` so that Typescript correctly shows errors for incompatible types in `loader` and `action` functions. ([#4734](https://github.com/remix-run/remix/pull/4734))
- Fix error boundary tracking for multiple errors bubbling to the same boundary ([#4829](https://github.com/remix-run/remix/pull/4829))
- Fixed an issue where a loader's `Request` object reflected `method: "POST"` on document submissions ([`a74e51830`](https://github.com/remix-run/remix/commit/a74e51830ec7ecb3ad30e45013270ebf71d7b425))

## 1.8.2

### Patch Changes

- Remove `instanceof Response` checks in favor of `isResponse` ([#4782](https://github.com/remix-run/remix/pull/4782))
- Fix performance regression with creation of `@remix-run/router` static handler ([#4790](https://github.com/remix-run/remix/pull/4790))
- Update dependency for `@remix-run/router` to `v1.0.5` ([`bd84a9317`](https://github.com/remix-run/remix/commit/bd84a931770a6b5e20c2f21839b4322023432b25))

## 1.8.1

No significant changes to this package were made in this release. [See the releases page on GitHub](https://github.com/remix-run/remix/releases/tag/remix%401.8.1) for an overview of all changes in v1.8.1.

## 1.8.0

### Minor Changes

- We have been busy at work [Layering Remix on top of React Router 6.4](https://github.com/remix-run/remix/blob/main/decisions/0007-remix-on-react-router-6-4-0.md) and are excited to be releasing step 1 in this process that consists of performing all server-side data fetches/mutations through the new framework agnostic `@remix-run/router`. Server- and client-side rendering are still done the same as before, and will be updated in subsequent releases. ([#4612](https://github.com/remix-run/remix/pull/4612))
- Importing functions and types from the `remix` package is deprecated, and all ([#3284](https://github.com/remix-run/remix/pull/3284))
  exported modules will be removed in the next major release. For more details,
  [see the release notes for 1.4.0](https://github.com/remix-run/remix/releases/tag/v1.4.0)
  where these changes were first announced.
- Added support for a new route `meta` API to handle arrays of tags instead of an object. For details, check out the [RFC](https://github.com/remix-run/remix/discussions/4462). ([#4610](https://github.com/remix-run/remix/pull/4610))

### Patch Changes

- Properly categorize internal framework-thrown error Responses as error boundary errors ([#4385](https://github.com/remix-run/remix/pull/4385))

  Previously there was some ambiguity around _"thrown Responses go to the `CatchBoundary`"_.
  The `CatchBoundary` exists to give the _user_ a place to handle non-happy path code flows
  such that they can throw `Response` instances from _their own code_ and handle them in a
  `CatchBoundary`. However, there are a handful of framework-internal errors that make
  sense to have a non-500 status code, and the fact that these were being thrown as `Response` instances
  was causing them to go into the `CatchBoundary`, even though they were not user-thrown.

  With this change, anything thrown by the framework itself (`Error` or `Response`) will
  go to the `ErrorBoundary`, and any user-thrown `Response` instances will go to the
  `CatchBoundary`. There is one exception to this rule, which is that framework-detected
  404's will continue to go to the `CatchBoundary` since users should have one single
  location to handle 404 displays.

  The primary affected use cases are scenarios such as:

  - HTTP `OPTIONS` requests (405 Unsupported Method )
  - `GET` requests to routes without loaders (400 Bad Request)
  - `POST` requests to routes without actions (405 Method Not Allowed)
  - Missing route id in `_data` parameters (403 Forbidden)
  - Non-matching route id included in `_data` parameters (403 Forbidden)

## 1.7.6

No significant changes to this package were made in this release. [See the releases page on GitHub](https://github.com/remix-run/remix/releases/tag/remix%401.7.6) for an overview of all changes in v1.7.6.

## 1.7.5

No significant changes to this package were made in this release. [See the releases page on GitHub](https://github.com/remix-run/remix/releases/tag/remix%401.7.5) for an overview of all changes in v1.7.5.

## 1.7.4

### Patch Changes

- Ignore pathless layout routes in action matches ([#4376](https://github.com/remix-run/remix/pull/4376))

## 1.7.3

No significant changes to this package were made in this release. [See the releases page on GitHub](https://github.com/remix-run/remix/releases/tag/remix%401.7.3) for an overview of all changes in v1.7.3.

## 1.7.2

### Patch Changes

- Fix dependency conflicts with `type-fest` ([`87642b71b`](https://github.com/remix-run/remix/commit/87642b71b20880707cf2d9168a113b9dca406ee8))

## 1.7.1

### Patch Changes

- Properly locked the dependency on `react-router-dom` to version 6.3.0 ([#4203](https://github.com/remix-run/remix/pull/4203))

## 1.7.0

### Minor Changes

- We've added a new type: `SerializeFrom`. This is used to infer the ([#4013](https://github.com/remix-run/remix/pull/4013))
  JSON-serialized return type of loaders and actions.
- `MetaFunction` type can now infer `data` and `parentsData` types from route loaders ([#4022](https://github.com/remix-run/remix/pull/4022))

### Patch Changes

- Improved performance for data serialization at runtime ([#3889](https://github.com/remix-run/remix/pull/3889))

## 1.6.8

### Patch Changes

- We've added type safety for load context. `AppLoadContext` is now an an interface mapping `string` to `unknown`, allowing users to extend it via module augmentation: ([#1876](https://github.com/remix-run/remix/pull/1876))

  ```ts
  declare module "@remix-run/server-runtime" {
    interface AppLoadContext {
      // add custom properties here!
    }
  }
  ```

## 1.6.7

No significant changes to this package were made in this release. [See the releases page on GitHub](https://github.com/remix-run/remix/releases/tag/remix%401.6.7) for an overview of all changes in v1.6.7.

## 1.6.6

No significant changes to this package were made in this release. [See the releases page on GitHub](https://github.com/remix-run/remix/releases/tag/remix%401.6.6) for an overview of all changes in v1.6.6.

## 1.6.5

### Patch Changes

- We enhanced the type signatures of `loader`/`action` and
  `useLoaderData`/`useActionData` to make it possible to infer the data type
  from return type of its related server function.

  To enable this feature, you will need to use the `LoaderArgs` type from your
  Remix runtime package instead of typing the function directly:

  ```diff
  - import type { LoaderFunction } from "@remix-run/[runtime]";
  + import type { LoaderArgs } from "@remix-run/[runtime]";

  - export const loader: LoaderFunction = async (args) => {
  -   return json<LoaderData>(data);
  - }
  + export async function loader(args: LoaderArgs) {
  +   return json(data);
  + }
  ```

  Then you can infer the loader data by using `typeof loader` as the type
  variable in `useLoaderData`:

  ```diff
  - let data = useLoaderData() as LoaderData;
  + let data = useLoaderData<typeof loader>();
  ```

  The API above is exactly the same for your route `action` and `useActionData`
  via the `ActionArgs` type.

  With this change you no longer need to manually define a `LoaderData` type
  (huge time and typo saver!), and we serialize all values so that
  `useLoaderData` can't return types that are impossible over the network, such
  as `Date` objects or functions.

  See the discussions in [#1254](https://github.com/remix-run/remix/pull/1254)
  and [#3276](https://github.com/remix-run/remix/pull/3276) for more context.
