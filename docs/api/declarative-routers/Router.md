---
title: Router
---

# Router

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/components.tsx
-->

[MODES: declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.Router.html)

Provides location context for the rest of the app.

Note: You usually won't render a `<Router>` directly. Instead, you'll render a
router that is more specific to your environment such as a `<BrowserRouter>`
in web browsers or a `<StaticRouter>` for server rendering.

## Signature

```tsx
function Router({
  basename: basenameProp = "/",
  children = null,
  location: locationProp,
  navigationType = NavigationType.Pop,
  navigator,
  static: staticProp = false,
}: RouterProps): React.ReactElement | null
```

## Props

### basename

The base path for the application. This is prepended to all locations

### children

Nested [`Route`](../components/Route) elements describing the route tree

### location

The location to match against. Defaults to the current location.
This can be a string or an object with `pathname`, `search`, `hash`, `state`, and `key`.

### navigationType

The type of navigation that triggered this location change.
Defaults to `NavigationType.Pop`.

### navigator

The navigator to use for navigation. This is usually a history object
or a custom navigator that implements the [`Navigator`](https://api.reactrouter.com/v7/interfaces/react_router.Navigator.html) interface.

### static

Whether this router is static or not (used for SSR). If `true`, the router
will not be reactive to location changes.

