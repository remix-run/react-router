# `@remix-run/serve`

## 1.16.0

### Patch Changes

- add `@remix-run/node/install` side-effect to allow `node --require @remix-run/node/install` ([#6132](https://github.com/remix-run/remix/pull/6132))
- Updated dependencies:
  - `@remix-run/express@1.16.0`
  - `@remix-run/node@1.16.0`

## 1.15.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.15.0`

## 1.14.3

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.14.3`

## 1.14.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.14.2`

## 1.14.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.14.1`

## 1.14.0

### Patch Changes

- Allow configurable `NODE_ENV` with `remix-serve` ([#5540](https://github.com/remix-run/remix/pull/5540))
- Sync `FutureConfig` interface between packages ([#5398](https://github.com/remix-run/remix/pull/5398))
- Updated dependencies:
  - `@remix-run/express@1.14.0`

## 1.13.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.13.0`

## 1.12.0

### Minor Changes

- Added a new development server available in the Remix config under the `unstable_dev` flag. [See the release notes](https://github.com/remix-run/remix/releases/tag/remix%401.12.0) for a full description. ([#5133](https://github.com/remix-run/remix/pull/5133))

### Patch Changes

- Updated dependencies:
  - `@remix-run/express@1.12.0`

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
