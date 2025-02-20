# `@react-router/cloudflare`

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

- For Remix consumers migrating to React Router, all exports from `@remix-run/cloudflare-pages` are now provided for React Router consumers in the `@react-router/cloudflare` package. There is no longer a separate package for Cloudflare Pages. ([#11801](https://github.com/remix-run/react-router/pull/11801))
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

### Minor Changes

- The `@remix-run/cloudflare-workers` package has been deprecated. Remix consumers migrating to React Router should use the `@react-router/cloudflare` package directly. For guidance on how to use `@react-router/cloudflare` within a Cloudflare Workers context, refer to the Cloudflare Workers template. ([#11801](https://github.com/remix-run/react-router/pull/11801))

### Patch Changes

- Updated dependencies:
  - `react-router@7.0.0`
