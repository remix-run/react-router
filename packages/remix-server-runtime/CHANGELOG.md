# `@remix-run/server-runtime`

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
