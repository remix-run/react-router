---
title: useMatches
---

# useMatches

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.useMatches.html)

Returns the active route matches, useful for accessing `loaderData` for
parent/child routes or the route [`handle`](../../start/framework/route-module#handle)
property.

```tsx
import { useMatches } from "react-router";

function SomeComponent() {
  const matches = useMatches();
}
```

Each match object contains the following properties:

| Property     | Description                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `id`         | The route id                                                                                                 |
| `pathname`   | The portion of the URL that the route matched                                                               |
| `params`     | The route's parsed [URL params](../../start/framework/routing#dynamic-segments)                             |
| `loaderData` | The data returned from the route's [`loader`](../../start/framework/route-module#loader) or [`clientLoader`](../../start/framework/route-module#clientloader) |
| `handle`     | The route's [`handle`](../../start/framework/route-module#handle) export, with any app-specific data on it  |

<docs-info>useMatches only works with a data router like `createBrowserRouter`,
since they know the full route tree up front and can provide all of the current
matches. Additionally, `useMatches` will not match down into any descendant route
trees since the router isn't aware of the descendant routes.</docs-info>

### Breadcrumbs

Pairing the route `handle` with `useMatches` gets very powerful since you can put
whatever you want on a route handle and have access to it anywhere via `useMatches`.
The proverbial use case is rendering breadcrumbs in a layout route from data owned
by its child routes:

```tsx
// Give each route a `breadcrumb` handle
export const handle = {
  breadcrumb: () => <Link to="/parent">Some Route</Link>,
};
```

```tsx
// Read the handles back out in a layout/root component
function Breadcrumbs() {
  let matches = useMatches();
  let crumbs = matches
    .filter((match) => Boolean(match.handle?.breadcrumb))
    .map((match) => match.handle.breadcrumb(match));

  return (
    <ol>
      {crumbs.map((crumb, index) => (
        <li key={index}>{crumb}</li>
      ))}
    </ol>
  );
}
```

See [Using `handle`](../../how-to/using-handle) for a complete, working example.

## Signature

```tsx
function useMatches(): UIMatch[]
```

## Returns

An array of [UI matches](https://api.reactrouter.com/v8/interfaces/react-router.UIMatch.html) for the current route hierarchy

