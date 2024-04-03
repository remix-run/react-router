---
"react-router-dom": minor
---

Add built-in Remix-style hydration support to `RouterProvider`. When running from a Remix-SSR'd HTML payload with the proper `window` variables (`__remixContext`, `__remixManifest`, `__remixRouteModules`), you don't need to pass a `router` prop and `RouterProvider` will create the `router` for you internally. ([#11396](https://github.com/remix-run/react-router/pull/11396))
