# `@react-router/architect`

## 7.10.1-pre.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.10.1-pre.0`
  - `@react-router/node@7.10.1-pre.0`

## 7.10.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.10.0`
  - `@react-router/node@7.10.0`

## 7.9.6

### Patch Changes

- Updated dependencies:
  - `react-router@7.9.6`
  - `@react-router/node@7.9.6`

## 7.9.5

### Patch Changes

- Updated dependencies:
  - `react-router@7.9.5`
  - `@react-router/node@7.9.5`

## 7.9.4

### Patch Changes

- Updated dependencies:
  - `react-router@7.9.4`
  - `@react-router/node@7.9.4`

## 7.9.3

### Patch Changes

- Updated dependencies:
  - `react-router@7.9.3`
  - `@react-router/node@7.9.3`

## 7.9.2

### Patch Changes

- Updated dependencies:
  - `react-router@7.9.2`
  - `@react-router/node@7.9.2`

## 7.9.1

### Patch Changes

- Updated dependencies:
  - `react-router@7.9.1`
  - `@react-router/node@7.9.1`

## 7.9.0

### Minor Changes

- Stabilize middleware and context APIs. ([#14215](https://github.com/remix-run/react-router/pull/14215))

  We have removed the `unstable_` prefix from the following APIs and they are now considered stable and ready for production use:
  - [`RouterContextProvider`](https://reactrouter.com/api/utils/RouterContextProvider)
  - [`createContext`](https://reactrouter.com/api/utils/createContext)
  - `createBrowserRouter` [`getContext`](https://reactrouter.com/api/data-routers/createBrowserRouter#optsgetcontext) option
  - `<HydratedRouter>` [`getContext`](https://reactrouter.com/api/framework-routers/HydratedRouter#getcontext) prop

  Please see the [Middleware Docs](https://reactrouter.com/how-to/middleware), the [Middleware RFC](https://github.com/remix-run/remix/discussions/7642), and the [Client-side Context RFC](https://github.com/remix-run/react-router/discussions/9856) for more information.

### Patch Changes

- Updated dependencies:
  - `react-router@7.9.0`
  - `@react-router/node@7.9.0`

## 7.8.2

### Patch Changes

- Updated dependencies:
  - `react-router@7.8.2`
  - `@react-router/node@7.8.2`

## 7.8.1

### Patch Changes

- Updated dependencies:
  - `react-router@7.8.1`
  - `@react-router/node@7.8.1`

## 7.8.0

### Patch Changes

- \[UNSTABLE] Change `getLoadContext` signature (`type GetLoadContextFunction`) when `future.unstable_middleware` is enabled so that it returns an `unstable_RouterContextProvider` instance instead of a `Map` used to contruct the instance internally ([#14097](https://github.com/remix-run/react-router/pull/14097))
  - This also removes the `type unstable_InitialContext` export
  - ⚠️ This is a breaking change if you have adopted middleware and are using a custom server with a `getLoadContext` function

- Updated dependencies:
  - `react-router@7.8.0`
  - `@react-router/node@7.8.0`

## 7.7.1

### Patch Changes

- Updated dependencies:
  - `react-router@7.7.1`
  - `@react-router/node@7.7.1`

## 7.7.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.7.0`
  - `@react-router/node@7.7.0`

## 7.6.3

### Patch Changes

- Updated dependencies:
  - `@react-router/node@7.6.3`
  - `react-router@7.6.3`

## 7.6.2

### Patch Changes

- Updated dependencies:
  - `react-router@7.6.2`
  - `@react-router/node@7.6.2`

## 7.6.1

### Patch Changes

- Update `@architect/functions` from `^5.2.0` to `^7.0.0` ([#13556](https://github.com/remix-run/react-router/pull/13556))
- Updated dependencies:
  - `react-router@7.6.1`
  - `@react-router/node@7.6.1`

## 7.6.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.6.0`
  - `@react-router/node@7.6.0`

## 7.5.3

### Patch Changes

- Updated dependencies:
  - `react-router@7.5.3`
  - `@react-router/node@7.5.3`

## 7.5.2

### Patch Changes

- Updated dependencies:
  - `react-router@7.5.2`
  - `@react-router/node@7.5.2`

## 7.5.1

### Patch Changes

- Updated dependencies:
  - `react-router@7.5.1`
  - `@react-router/node@7.5.1`

## 7.5.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.5.0`
  - `@react-router/node@7.5.0`

## 7.4.1

### Patch Changes

- Updated dependencies:
  - `react-router@7.4.1`
  - `@react-router/node@7.4.1`

## 7.4.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.4.0`
  - `@react-router/node@7.4.0`

## 7.3.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.3.0`
  - `@react-router/node@7.3.0`

## 7.2.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.2.0`
  - `@react-router/node@7.2.0`

## 7.1.5

### Patch Changes

- Updated dependencies:
  - `react-router@7.1.5`
  - `@react-router/node@7.1.5`

## 7.1.4

### Patch Changes

- Updated dependencies:
  - `react-router@7.1.4`
  - `@react-router/node@7.1.4`

## 7.1.3

### Patch Changes

- Updated dependencies:
  - `react-router@7.1.3`
  - `@react-router/node@7.1.3`

## 7.1.2

### Patch Changes

- Updated dependencies:
  - `react-router@7.1.2`
  - `@react-router/node@7.1.2`

## 7.1.1

### Patch Changes

- Updated dependencies:
  - `react-router@7.1.1`
  - `@react-router/node@7.1.1`

## 7.1.0

### Patch Changes

- Updated dependencies:
  - `react-router@7.1.0`
  - `@react-router/node@7.1.0`

## 7.0.2

### Patch Changes

- Updated dependencies:
  - `react-router@7.0.2`
  - `@react-router/node@7.0.2`

## 7.0.1

### Patch Changes

- Updated dependencies:
  - `react-router@7.0.1`
  - `@react-router/node@7.0.1`

## 7.0.0

### Major Changes

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

### Patch Changes

- Updated dependencies:
  - `react-router@7.0.0`
  - `@react-router/node@7.0.0`
