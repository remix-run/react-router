---
title: RouterProvider
---

# RouterProvider

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/components.tsx
-->

[MODES: data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.RouterProvider.html)

Render the UI for the given [`DataRouter`](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html). This component should
typically be at the top of an app's element tree.

```tsx
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { createRoot } from "react-dom/client";

const router = createBrowserRouter(routes);
createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
```

<docs-info>Please note that this component is exported both from
`react-router` and `react-router/dom` with the only difference being that the
latter automatically wires up `react-dom`'s [`flushSync`](https://react.dev/reference/react-dom/flushSync)
implementation. You _almost always_ want to use the version from
`react-router/dom` unless you're running in a non-DOM environment.</docs-info>

## Signature

```tsx
function RouterProvider({
  router,
  flushSync: reactDomFlushSyncImpl,
  unstable_onError,
}: RouterProviderProps): React.ReactElement
```

## Props

### flushSync

The [`ReactDOM.flushSync`](https://react.dev/reference/react-dom/flushSync)
implementation to use for flushing updates.

You usually don't have to worry about this:
- The `RouterProvider` exported from `react-router/dom` handles this internally for you
- If you are rendering in a non-DOM environment, you can import
  `RouterProvider` from `react-router` and ignore this prop

### unstable_onError

An error handler function that will be called for any loader/action/render
errors that are encountered in your application.  This is useful for
logging or reporting errors instead of the `ErrorBoundary` because it's not
subject to re-rendering and will only run one time per error.

The `errorInfo` parameter is passed along from
[`componentDidCatch`](https://react.dev/reference/react/Component#componentdidcatch)
and is only present for render errors.

```tsx
<RouterProvider unstable_onError=(error, errorInfo) => {
  console.error(error, errorInfo);
  reportToErrorService(error, errorInfo);
}} />
```

### router

The [`DataRouter`](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html) instance to use for navigation and data fetching.

