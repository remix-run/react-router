# `@remix-run/node`

## 2.0.0-pre.10

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.0.0-pre.10`

## 2.0.0-pre.9

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.0.0-pre.9`

## 2.0.0-pre.8

### Major Changes

- Remove/align Remix types with those used in React Router ([#7319](https://github.com/remix-run/remix/pull/7319))

  - Change exposed `any` types to `unknown`
    - `AppData`
    - `useLocation.state`
    - `useMatches()[i].data`
    - `useFetcher().data`
    - `MetaMatch.handle`
  - `useMatches()[i].handle` type changed from `{ [k: string]: any }` to `unknown`
  - `AppLoadContext` type changed from `{ [k: string]: unknown }` to `unknown`
  - Rename the `useMatches()` return type from `RouteMatch` to `UIMatch`
  - Rename `LoaderArgs`/`ActionArgs` to `LoaderFunctionArgs`/`ActionFunctionArgs` and add a generic to accept a `context` type

- Remove `AppData`/`RouteHandle` types which are just aliases for `unknown` ([#7354](https://github.com/remix-run/remix/pull/7354))
- Stop exporting the `fetch` API in favor of using the version in the global scope - which is polyfilled via `installGlobals` ([#7293](https://github.com/remix-run/remix/pull/7293))

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.0.0-pre.8`

## 2.0.0-pre.7

### Patch Changes

- Update to latest web-std-io prereleases ([#7328](https://github.com/remix-run/remix/pull/7328))
- Updated dependencies:
  - `@remix-run/server-runtime@2.0.0-pre.7`

## 2.0.0-pre.6

### Patch Changes

- Remove `atob`/`btoa` polyfills in favor of built-in versions ([#7206](https://github.com/remix-run/remix/pull/7206))
- Updated dependencies:
  - `@remix-run/server-runtime@2.0.0-pre.6`

## 2.0.0-pre.5

### Patch Changes

- Add the rest of the Web Streams API to `installGlobals` ([#7321](https://github.com/remix-run/remix/pull/7321))
- Updated dependencies:
  - `@remix-run/server-runtime@2.0.0-pre.5`

## 2.0.0-pre.4

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.0.0-pre.4`

## 2.0.0-pre.3

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.0.0-pre.3`

## 2.0.0-pre.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.0.0-pre.2`

## 2.0.0-pre.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.0.0-pre.1`

## 2.0.0-pre.0

### Major Changes

- Require Node >=18.0.0 ([#6939](https://github.com/remix-run/remix/pull/6939))
- We have made a few important changes to the route `meta` API as reflected in the v1 implementation when using the `future.v2_meta` config option. ([#6958](https://github.com/remix-run/remix/pull/6958))

  - The `meta` function should no longer return an object, but an array of objects that map to the HTML tag's respective attributes. This provides more flexibility and control over how certain tags are rendered, and the order in which they appear.
  - In most cases, `meta` descriptor objects render a `<meta>` tag. There are a few notable exceptions:
    - `{ title: "My app" }` will render `<title>My app</title>`.
    - `{ 'script:ld+json': { /* ... */ } }` will render `<script type="application/ld+json">/* ... */</script>`, where the value is serialized to JSON and rendered inside the `<script>` tag.
    - `{ tagName: 'link', ...attributes }` will render `<link {...attributes} />`
      - This is useful for things like setting canonical URLs. For loading assets, we encourage you to use the `links` export instead.
      - It's important to note that `tagName` may only accept `meta` or `link`, so other arbitrary elements will be ignored.
  - `<Meta />` will no longer render the `meta` output from the entire route hierarchy. Only the output from the leaf (current) route will be rendered unless that route does not export a `meta` function, in which case the output from the nearest ancestor route with `meta` will be rendered.
    - This change comes from user feedback that auto-merging meta made effective SEO difficult to implement. Our goal is to give you as much control as you need over meta tags for each individual route.
    - Our suggested approach is to **only export a `meta` function from leaf route modules**. However, if you do want to render a tag from another matched route, `meta` now accepts a `matches` argument for you to merge or override parent route meta as you'd like.
    ```tsx
    export function meta({ matches }) {
      return [
        // render all ancestor route meta except for title tags
        ...matches
          .flatMap((match) => match.meta)
          .filter((match) => !("title" in match)),
        { title: "Override the title!" },
      ];
    }
    ```
  - The `parentsData` argument has been removed. If you need to access data from a parent route, you can use `matches` instead.
    ```tsx
    // before
    export function meta({ parentsData }) {
      return [{ title: parentsData["routes/some-route"].title }];
    }
    // after
    export function meta({ matches }) {
      return [
        {
          title: matches.find((match) => match.id === "routes/some-route").data
            .title,
        },
      ];
    }
    ```

- For preparation of using Node's built in fetch implementation, installing the fetch globals is now a responsibility of the app server. If you are using `remix-serve`, nothing is required. If you are using your own app server, you will need to install the globals yourself. ([#7009](https://github.com/remix-run/remix/pull/7009))

  ```js filename=server.js
  import { installGlobals } from "@remix-run/node";

  installGlobals();
  ```

  source-map-support is now a responsibility of the app server. If you are using `remix-serve`, nothing is required. If you are using your own app server, you will need to install [`source-map-support`](https://www.npmjs.com/package/source-map-support) yourself.

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

- Re-export new `redirectDocument` method from React Router ([#7040](https://github.com/remix-run/remix/pull/7040), [#6842](https://github.com/remix-run/remix/pull/6842)) ([#7040](https://github.com/remix-run/remix/pull/7040))

### Patch Changes

- Export proper `ErrorResponse` type for usage alongside `isRouteErrorResponse` ([#7244](https://github.com/remix-run/remix/pull/7244))
- ensures fetch() return is instanceof global Response by removing extended classes for NodeRequest and NodeResponse in favor of custom interface type cast. ([#7109](https://github.com/remix-run/remix/pull/7109))
- remove recursion from stream utilities ([#7245](https://github.com/remix-run/remix/pull/7245))
- Updated dependencies:
  - `@remix-run/server-runtime@2.0.0-pre.0`

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
