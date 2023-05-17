# `@remix-run/dev`

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
