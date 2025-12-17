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
router that is more specific to your environment such as a [`BrowserRouter`](../declarative-routers/BrowserRouter)
in web browsers or a [`ServerRouter`](../framework-routers/ServerRouter) for server rendering.

## Signature

```tsx
function Router({
  basename: basenameProp = "/",
  children = null,
  location: locationProp,
  navigationType = NavigationType.Pop,
  navigator,
  static: staticProp = false,
  unstable_useTransitions,
}: RouterProps): React.ReactElement | null
```

## Props

### basename

The base path for the application. This is prepended to all locations

### children

Nested [`Route`](../components/Route) elements describing the route tree

### location

The location to match against. Defaults to the current location.
This can be a string or a [`Location`](https://api.reactrouter.com/v7/interfaces/react_router.Location.html) object.

### navigationType

The type of navigation that triggered this `location` change.
Defaults to `NavigationType.Pop`.

### navigator

The navigator to use for navigation. This is usually a history object
or a custom navigator that implements the [`Navigator`](https://api.reactrouter.com/v7/interfaces/react_router.Navigator.html) interface.

### static

Whether this router is static or not (used for SSR). If `true`, the router
will not be reactive to location changes.

### unstable_useTransitions

Control whether router state updates are internally wrapped in
[`React.startTransition`](https://react.dev/reference/react/startTransition).

- When left `undefined`, all router state updates are wrapped in
  `React.startTransition`
- When set to `true`, [`Link`](../components/Link) and [`Form`](../components/Form) navigations will be wrapped
  in `React.startTransition` and all router state updates are wrapped in
  `React.startTransition`
- When set to `false`, the router will not leverage `React.startTransition`
  on any navigations or state changes.

For more information, please see the [docs](https://reactrouter.com/explanation/react-transitions).

