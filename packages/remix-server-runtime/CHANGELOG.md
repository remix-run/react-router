# `@remix-run/server-runtime`

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
