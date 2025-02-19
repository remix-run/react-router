# react-router-dom

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

- Remove the original `defer` implementation in favor of using raw promises via single fetch and `turbo-stream`. This removes these exports from React Router: ([#11744](https://github.com/remix-run/react-router/pull/11744))

  - `defer`
  - `AbortedDeferredError`
  - `type TypedDeferredData`
  - `UNSAFE_DeferredData`
  - `UNSAFE_DEFERRED_SYMBOL`,

- Use `createRemixRouter`/`RouterProvider` in `entry.client` instead of `RemixBrowser` ([#11469](https://github.com/remix-run/react-router/pull/11469))

- Remove single_fetch future flag. ([#11522](https://github.com/remix-run/react-router/pull/11522))

- Remove `future.v7_startTransition` flag ([#11696](https://github.com/remix-run/react-router/pull/11696))

- Remove `future.v7_normalizeFormMethod` future flag ([#11697](https://github.com/remix-run/react-router/pull/11697))

- Allow returning `undefined` from actions and loaders ([#11680](https://github.com/remix-run/react-router/pull/11680))

- update minimum node version to 18 ([#11690](https://github.com/remix-run/react-router/pull/11690))

- Remove `future.v7_prependBasename` from the ionternalized `@remix-run/router` package ([#11726](https://github.com/remix-run/react-router/pull/11726))

- Remove `future.v7_throwAbortReason` from internalized `@remix-run/router` package ([#11728](https://github.com/remix-run/react-router/pull/11728))

- Add `exports` field to all packages ([#11675](https://github.com/remix-run/react-router/pull/11675))

- node package no longer re-exports from react-router ([#11702](https://github.com/remix-run/react-router/pull/11702))

- updates the minimum React version to 18 ([#11689](https://github.com/remix-run/react-router/pull/11689))

- - Remove the `future.v7_partialHydration` flag ([#11725](https://github.com/remix-run/react-router/pull/11725))
    - This also removes the `<RouterProvider fallbackElement>` prop
      - To migrate, move the `fallbackElement` to a `hydrateFallbackElement`/`HydrateFallback` on your root route
    - Also worth nothing there is a related breaking changer with this future flag:
      - Without `future.v7_partialHydration` (when using `fallbackElement`), `state.navigation` was populated during the initial load
      - With `future.v7_partialHydration`, `state.navigation` remains in an `"idle"` state during the initial load

- Remove `future.v7_fetcherPersist` flag ([#11731](https://github.com/remix-run/react-router/pull/11731))

### Minor Changes

- Add prefetching support to `Link`/`NavLink` when using Remix SSR ([#11402](https://github.com/remix-run/react-router/pull/11402))
- Enhance `ScrollRestoration` so it can restore properly on an SSR'd document load ([#11401](https://github.com/remix-run/react-router/pull/11401))
- Add built-in Remix-style hydration support to `RouterProvider`. When running from a Remix-SSR'd HTML payload with the proper `window` variables (`__remixContext`, `__remixManifest`, `__remixRouteModules`), you don't need to pass a `router` prop and `RouterProvider` will create the `router` for you internally. ([#11396](https://github.com/remix-run/react-router/pull/11396)) ([#11400](https://github.com/remix-run/react-router/pull/11400))

### Patch Changes

- Memoize some `RouterProvider` internals to reduce uneccesary re-renders ([#11817](https://github.com/remix-run/react-router/pull/11817))
- Updated dependencies:
  - `react-router@7.0.0`
