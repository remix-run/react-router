# `@remix-run/serve`

## 1.12.0-pre.3

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.12.0-pre.3`

## 1.12.0-pre.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.12.0-pre.2`

## 1.12.0-pre.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.12.0-pre.1`

## 1.12.0-pre.0

### Minor Changes

- # The new dev server ([#5133](https://github.com/remix-run/remix/pull/5133))

  The new dev flow is to spin up the dev server _alongside_ your normal Remix app server:

  ```sh
  # spin up the new dev server
  remix dev

  # spin up your app server in a separate tab or via `concurrently`
  nodemon ./server.js
  ```

  The dev server will build your app in dev mode and then rebuild whenever any app files change.
  It will also wait for your app server to be "ready" (more on this later) before triggering a live reload in your browser.

  ## Benefits

  - Navigations no longer wipe in-memory references (e.g. database connections, in-memory caches, etc...). That means no need to use `global` trick anymore.
  - Supports _any_ app server, not just the Remix App Server.
  - Automatically wires up the live reload port for you (no need for you to mess with env vars for that anymore)

  ## App server picks up changes

  Use `nodemon` (or similar) so that your app server restarts and picks up changes after a rebuild finishes.

  For example, you can use `wrangler --watch` for Cloudflare.

  Alternatively, you can roll your own with `chokidar` (or similar) if you want to still use the `global` trick to persist in-memory stuff across rebuilds.

  ## Configure

  To enable the new dev server with all defaults, set the `unstable_dev` future flag to `true`:

  ```js
  // remix.config.js

  module.exports = {
    future: {
      unstable_dev: true,
    },
  };
  ```

  You can also set specific options:

  ```js
  // remix.config.js

  module.exports = {
    future: {
      unstable_dev: {
        // Port to use for the dev server (i.e. the live reload websocket)
        // Can be overridden by a CLI flag: `remix dev --port 3011`
        // default: finds an empty port and uses that
        port: 3010,

        // Port for your running Remix app server
        // Can be overridden by a CLI flag: `remix dev --app-server-port 3021`
        // default: `3000`
        appServerPort: 3020,

        // Path to the Remix request handler in your app server
        // Most app server will route all requests to the Remix request handler and will not need to set this option.
        // If your app server _does_ route only certain request paths to the Remix request handler, then you'll need to set this.
        // default: `""`
        remixRequestHandlerPath: "/products",

        // Milliseconds between "readiness" pings to your app server
        // When a Remix rebuild finishes, the dev server will ping a special endpoint (`__REMIX_ASSETS_MANIFEST`)
        // to check if your app server is serving up-to-date routes and assets.
        // You can set this option to tune how frequently the dev server polls your app server.
        // default: `50`
        rebuildPollIntervalMs: 25,
      },
    },
  };
  ```

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.12.0-pre.0`

## 1.11.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.11.1`

## 1.11.0

### Patch Changes

- Introduces the `defer()` API from `@remix-run/router` with support for server-rendering and HTTP streaming. This utility allows you to defer values returned from `loader` functions by returning promises instead of resolved values. This has been refered to as _"sending a promise over the wire"_. ([#4920](https://github.com/remix-run/remix/pull/4920))

  Informational Resources:

  - <https://gist.github.com/jacob-ebey/9bde9546c1aafaa6bc8c242054b1be26>
  - <https://github.com/remix-run/remix/blob/main/decisions/0004-streaming-apis.md>

  Documentation Resources (better docs specific to Remix are in the works):

  - <https://reactrouter.com/en/main/utils/defer>
  - <https://reactrouter.com/en/main/components/await>
  - <https://reactrouter.com/en/main/hooks/use-async-value>
  - <https://reactrouter.com/en/main/hooks/use-async-error>

- Updated dependencies:
  - `@remix-run/express@1.11.0`

## 1.10.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.10.1`

## 1.10.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.10.0`

## 1.9.0

### Patch Changes

- Fix `TypedResponse` so that Typescript correctly shows errors for incompatible types in `loader` and `action` functions. ([#4734](https://github.com/remix-run/remix/pull/4734))
- Updated dependencies:
  - `@remix-run/express@1.9.0`

## 1.8.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.8.2`

## 1.8.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.8.1`

## 1.8.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.8.0`

## 1.7.6

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.7.6`

## 1.7.5

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.7.5`

## 1.7.4

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.7.4`

## 1.7.3

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.7.3`

## 1.7.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.7.2`

## 1.7.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.7.1`

## 1.7.0

### Minor Changes

- We've added a new type: `SerializeFrom`. This is used to infer the ([#4013](https://github.com/remix-run/remix/pull/4013))
  JSON-serialized return type of loaders and actions.
- `MetaFunction` type can now infer `data` and `parentsData` types from route loaders ([#4022](https://github.com/remix-run/remix/pull/4022))

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.7.0`

## 1.6.8

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.6.8`

## 1.6.7

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.6.7`

## 1.6.6

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.6.6`

## 1.6.5

### Patch Changes

- Updated dependencies
  - `@remix-run/express@1.6.5`
