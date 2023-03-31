# `@remix-run/server-runtime`

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
        let rootModule = matches.find((match) => match.route.id === "root");
      }
      // after
      export function meta({ matches }) {
        let rootModule = matches.find((match) => match.id === "root");
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

  ```jsx
  // Current (Remix v1 default)
  import { useCatch } from "@remix-run/react";

  export function CatchBoundary() {
    let caught = useCatch();
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

  ```jsx
  // Using future.v2_errorBoundary
  import { isRouteErrorResponse, useRouteError } from "@remix-run/react";

  export function ErrorBoundary() {
    let error = useRouteError();

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
