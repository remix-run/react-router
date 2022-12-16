# `@remix-run/serve`

## 1.9.0

### Patch Changes

- Fix `TypedResponse` so that Typescript correctly shows errors for incompatible types in `loader` and `action` functions. ([#4734](https://github.com/remix-run/remix/pull/4734))

  Previously, when the return type of a `loader` or `action` was explicitly set to `TypedResponse<SomeType>`,
  Typescript would not show errors when the function returned an incompatible type.

  For example:

  ```ts
  export const action = async (
    args: ActionArgs
  ): Promise<TypedResponse<string>> => {
    return json(42);
  };
  ```

  In this case, Typescript would not show an error even though `42` is clearly not a `string`.

  This happens because `json` returns a `TypedResponse<string>`, but because `TypedReponse<string>` was previously just `Response & { json: () => Promise<string> }` and `Response` already defines `{ json: () => Promise<any> }`, type erasure caused `Promise<any>` to be used for `42`.

  To fix this, we explicitly omit the `Response` object's `json` property before intersecting with `{ json: () => Promise<T> }`.

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
