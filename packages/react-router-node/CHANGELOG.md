# `@react-router/node`

## 7.7.1

### Patch Changes

- Updated dependencies:
  - `react-router@7.7.1`

## 7.7.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.7.0`

## 7.6.3

### Patch Changes

- Remove old "install" package exports ([#13762](https://github.com/remix-run/react-router/pull/13762))
- Updated dependencies:
  - `react-router@7.6.3`

## 7.6.2

### Patch Changes

- Updated dependencies:
  - `react-router@7.6.2`

## 7.6.1

### Patch Changes

- Updated dependencies:
  - `react-router@7.6.1`

## 7.6.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.6.0`

## 7.5.3

### Patch Changes

- Updated dependencies:
  - `react-router@7.5.3`

## 7.5.2

### Patch Changes

- Updated dependencies:
  - `react-router@7.5.2`

## 7.5.1

### Patch Changes

- Updated dependencies:
  - `react-router@7.5.1`

## 7.5.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.5.0`

## 7.4.1

### Patch Changes

- Updated dependencies:
  - `react-router@7.4.1`

## 7.4.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.4.0`

## 7.3.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.3.0`

## 7.2.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.2.0`

## 7.1.5

### Patch Changes

- Updated dependencies:
  - `react-router@7.1.5`

## 7.1.4

### Patch Changes

- Updated dependencies:
  - `react-router@7.1.4`

## 7.1.3

### Patch Changes

- Updated dependencies:
  - `react-router@7.1.3`

## 7.1.2

### Patch Changes

- Updated dependencies:
  - `react-router@7.1.2`

## 7.1.1

### Patch Changes

- Updated dependencies:
  - `react-router@7.1.1`

## 7.1.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.1.0`

## 7.0.2

### Patch Changes

- Updated dependencies:
  - `react-router@7.0.2`

## 7.0.1

### Patch Changes

- Updated dependencies:
  - `react-router@7.0.1`

## 7.0.0

### Major Changes

- Remove single fetch future flag. ([#11522](https://github.com/remix-run/react-router/pull/11522))

- For Remix consumers migrating to React Router, the `crypto` global from the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) is now required when using cookie and session APIs. This means that the following APIs are provided from `react-router` rather than platform-specific packages: ([#11837](https://github.com/remix-run/react-router/pull/11837))

  - `createCookie`
  - `createCookieSessionStorage`
  - `createMemorySessionStorage`
  - `createSessionStorage`

  For consumers running older versions of Node, the `installGlobals` function from `@remix-run/node` has been updated to define `globalThis.crypto`, using [Node's `require('node:crypto').webcrypto` implementation.](https://nodejs.org/api/webcrypto.html)

  Since platform-specific packages no longer need to implement this API, the following low-level APIs have been removed:

  - `createCookieFactory`
  - `createSessionStorageFactory`
  - `createCookieSessionStorageFactory`
  - `createMemorySessionStorageFactory`

- update minimum node version to 18 ([#11690](https://github.com/remix-run/react-router/pull/11690))

- Add `exports` field to all packages ([#11675](https://github.com/remix-run/react-router/pull/11675))

- node package no longer re-exports from react-router ([#11702](https://github.com/remix-run/react-router/pull/11702))

- Drop support for Node 18, update minimum Node vestion to 20 ([#12171](https://github.com/remix-run/react-router/pull/12171))
  - Remove `installGlobals()` as this should no longer be necessary

### Patch Changes

- Add createRequestListener to @react-router/node ([#12319](https://github.com/remix-run/react-router/pull/12319))
- Remove unstable upload handler. ([#12015](https://github.com/remix-run/react-router/pull/12015))
- Remove unneeded dependency on @web3-storage/multipart-parser ([#12274](https://github.com/remix-run/react-router/pull/12274))
- Updated dependencies:
  - `react-router@7.0.0`

## 2.9.0

### Minor Changes

- Use undici as our fetch polyfill going forward ([#9106](https://github.com/remix-run/remix/pull/9106), [#9111](https://github.com/remix-run/remix/pull/9111))
- Put `undici` fetch polyfill behind a new `installGlobals({ nativeFetch: true })` parameter ([#9198](https://github.com/remix-run/remix/pull/9198))
  - `remix-serve` will default to using `undici` for the fetch polyfill if `future._unstable_singleFetch` is enabled because the single fetch implementation relies on the `undici` polyfill
    - Any users opting into Single Fetch and managing their own polfill will need to pass the flag to `installGlobals` on their own to avoid runtime errors with Single Fetch

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.9.0`

## 2.8.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.8.1`

## 2.8.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.8.0`

## 2.7.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.7.2`

## 2.7.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.7.1`

## 2.7.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.7.0`

## 2.6.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.6.0`

## 2.5.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.5.1`

## 2.5.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.5.0`

## 2.4.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.4.1`

## 2.4.0

### Minor Changes

- Deprecate `DataFunctionArgs` in favor of `LoaderFunctionArgs`/`ActionFunctionArgs`. This is aimed at keeping the types aligned across server/client loaders/actions now that `clientLoader`/`clientActon` functions have `serverLoader`/`serverAction` parameters which differentiate `ClientLoaderFunctionArgs`/`ClientActionFunctionArgs`. ([#8173](https://github.com/remix-run/remix/pull/8173))

### Patch Changes

- Update to `@remix-run/web-fetch@4.4.2` ([#8231](https://github.com/remix-run/remix/pull/8231))
- Updated dependencies:
  - `@remix-run/server-runtime@2.4.0`

## 2.3.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.3.1`

## 2.3.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.3.0`

## 2.2.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.2.0`

## 2.1.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.1.0`

## 2.0.1

### Patch Changes

- Switch from `crypto.randomBytes` to `crypto.webcrypto.getRandomValues` for file session storage ID generation ([#7203](https://github.com/remix-run/remix/pull/7203))
- Use native `Blob` class instead of polyfill ([#7217](https://github.com/remix-run/remix/pull/7217))
- Updated dependencies:
  - `@remix-run/server-runtime@2.0.1`
  - [`@remix-run/web-fetch@4.4.1`](https://github.com/remix-run/web-std-io/releases/tag/%40remix-run%2Fweb-fetch%404.4.1)

## 2.0.0

### Major Changes

- Require Node >=18.0.0 ([#6939](https://github.com/remix-run/remix/pull/6939))

- Stop exporting the `fetch` API in favor of using the version in the global scope - which can be polyfilled via `installGlobals` ([#7293](https://github.com/remix-run/remix/pull/7293))

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

- The route `meta` API now defaults to the new "V2 Meta" API ([#6958](https://github.com/remix-run/remix/pull/6958))
  - Please refer to the ([docs](https://remix.run/docs/en/2.0.0/route/meta) and [Preparing for V2](https://remix.run/docs/en/2.0.0/start/v2#route-meta) guide for more information.

- For preparation of using Node's built in fetch implementation, installing the fetch globals is now a responsibility of the app server ([#7009](https://github.com/remix-run/remix/pull/7009))
  - If you are using `remix-serve`, nothing is required
  - If you are using your own app server, you will need to install the globals yourself

    ```js filename=server.js
    import { installGlobals } from "@remix-run/node";

    installGlobals();
    ```

- `source-map-support` is now a responsibility of the app server ([#7009](https://github.com/remix-run/remix/pull/7009))
  - If you are using `remix-serve`, nothing is required
  - If you are using your own app server, you will need to install [`source-map-support`](https://www.npmjs.com/package/source-map-support) yourself.

    ```sh
    npm i source-map-support
    ```

    ```js filename=server.js
    import sourceMapSupport from "source-map-support";
    sourceMapSupport.install();
    ```

- Removed support for "magic exports" from the `remix` package. This package can be removed from your `package.json` and you should update all imports to use the source `@remix-run/*` packages: ([#6895](https://github.com/remix-run/remix/pull/6895))

  ```diff
  - import type { ActionArgs } from "remix";
  - import { json, useLoaderData } from "remix";
  + import type { ActionArgs } from "@remix-run/node";
  + import { json } from "@remix-run/node";
  + import { useLoaderData } from "@remix-run/react";
  ```

### Minor Changes

- Re-export the new `redirectDocument` method from React Router ([#7040](https://github.com/remix-run/remix/pull/7040), [#6842](https://github.com/remix-run/remix/pull/6842)) ([#7040](https://github.com/remix-run/remix/pull/7040))

### Patch Changes

- Remove `atob`/`btoa` polyfills in favor of built-in versions ([#7206](https://github.com/remix-run/remix/pull/7206))
- Export proper `ErrorResponse` type for usage alongside `isRouteErrorResponse` ([#7244](https://github.com/remix-run/remix/pull/7244))
- Add the rest of the Web Streams API to `installGlobals` ([#7321](https://github.com/remix-run/remix/pull/7321))
- Ensures `fetch()` return is `instanceof global Response` by removing extended classes for `NodeRequest` and `NodeResponse` in favor of custom interface type cast ([#7109](https://github.com/remix-run/remix/pull/7109))
- Remove recursion from stream utilities ([#7245](https://github.com/remix-run/remix/pull/7245))
- Updated dependencies:
  - `@remix-run/server-runtime@2.0.0`
  - `@remix-run/web-fetch@4.4.0`
  - `@remix-run/web-file@3.1.0`
  - `@remix-run/web-stream@1.1.0`

## 1.19.3

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.19.3`

## 1.19.2

### Patch Changes

- Update to latest `@remix-run/web-*` packages ([#7026](https://github.com/remix-run/remix/pull/7026))
- Updated dependencies:
  - `@remix-run/server-runtime@1.19.2`

## 1.19.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.19.1`

## 1.19.0

### Patch Changes

- Upgrade to [`@remix-run/web-fetch@4.3.5`](https://github.com/remix-run/web-std-io/releases/tag/%40remix-run%2Fweb-fetch%404.3.5). Submitted empty file inputs are now correctly parsed out as empty `File` instances instead of being surfaced as an empty string via `request.formData()` ([#6816](https://github.com/remix-run/remix/pull/6816))
- Updated dependencies:
  - `@remix-run/server-runtime@1.19.0`

## 1.18.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.18.1`

## 1.18.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.18.0`

## 1.17.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.17.1`

## 1.17.0

### Patch Changes

- Add `HeadersArgs` type to be consistent with loaders/actions/meta and allows for using a `function` declaration in addition to an arrow function expression ([#6247](https://github.com/remix-run/remix/pull/6247))

  ```tsx
  import type { HeadersArgs } from "@remix-run/node"; // or cloudflare/deno

  export function headers({ loaderHeaders }: HeadersArgs) {
    return {
      "x-my-custom-thing": loaderHeaders.get("x-my-custom-thing") || "fallback",
    };
  }
  ```

- Fix `request.clone() instanceof Request` returning false. ([#6512](https://github.com/remix-run/remix/pull/6512))

- Updated dependencies:
  - `@remix-run/server-runtime@1.17.0`

## 1.16.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.16.1`

## 1.16.0

### Patch Changes

- add `@remix-run/node/install` side-effect to allow `node --require @remix-run/node/install` ([#6132](https://github.com/remix-run/remix/pull/6132))
- add `logDevReady` as replacement for platforms that can't initialize async I/O outside of the request response lifecycle. ([#6204](https://github.com/remix-run/remix/pull/6204))
- add missing files to published package ([#6179](https://github.com/remix-run/remix/pull/6179))
- Updated dependencies:
  - `@remix-run/server-runtime@1.16.0`

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

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.15.0`

## 1.14.3

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.14.3`

## 1.14.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.14.2`

## 1.14.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.14.1`

## 1.14.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.14.0`

## 1.13.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.13.0`

## 1.12.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.12.0`

## 1.11.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.11.1`

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
  - `@remix-run/server-runtime@1.11.0`

## 1.10.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.10.1`

## 1.10.0

### Patch Changes

- Export `V2_HtmlMetaDescriptor` and `V2_MetaFunction` types from runtime packages ([#4943](https://github.com/remix-run/remix/pull/4943))
- Updated dependencies:
  - `@remix-run/server-runtime@1.10.0`

## 1.9.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.9.0`

## 1.8.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.8.2`

## 1.8.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.8.1`

## 1.8.0

### Minor Changes

- Importing functions and types from the `remix` package is deprecated, and all ([#3284](https://github.com/remix-run/remix/pull/3284))
  exported modules will be removed in the next major release. For more details,
  [see the release notes for 1.4.0](https://github.com/remix-run/remix/releases/tag/v1.4.0)
  where these changes were first announced.

### Patch Changes

- Update `@remix-run/web-fetch`. This addresses two bugs: ([#4644](https://github.com/remix-run/remix/pull/4644))
  - It fixes a memory leak caused by unregistered listeners
  - It adds support for custom `"credentials"` values (Remix does nothing with these at the moment, but they pass through for the consumer of the request to access if needed)
- Updated dependencies:
  - `@remix-run/server-runtime@1.8.0`

## 1.7.6

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.7.6`

## 1.7.5

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.7.5`

## 1.7.4

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.7.4`

## 1.7.3

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.7.3`
  - `@remix-run/web-fetch@4.3.1`

## 1.7.2

### Patch Changes

- Flush Node streams to address issues with libraries like `compression` that rely on chunk flushing ([#4235](https://github.com/remix-run/remix/pull/4235))
- Updated dependencies:
  - `@remix-run/server-runtime@1.7.2`

## 1.7.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.7.1`

## 1.7.0

### Minor Changes

- We've added a new type: `SerializeFrom`. This is used to infer the ([#4013](https://github.com/remix-run/remix/pull/4013))
  JSON-serialized return type of loaders and actions.

### Patch Changes

- Fixed a bug when destroying `fileStorage` sessions to prevent deleting entire session directories
- Updated dependencies:
  - `@remix-run/server-runtime@1.7.0`

## 1.6.8

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.6.8`

## 1.6.7

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.6.7`

## 1.6.6

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.6.6`

## 1.6.5

### Patch Changes

- We enhanced the type signatures of `loader`/`action` and
  `useLoaderData`/`useActionData` to make it possible to infer the data type
  from return type of its related server function.

  To enable this feature, you will need to use the `LoaderArgs` type from
  `@remix-run/node` instead of typing the function directly:

  ```diff
  - import type { LoaderFunction } from "@remix-run/node";
  + import type { LoaderArgs } from "@remix-run/node";

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

- Updated dependencies
  - `@remix-run/server-runtime`
