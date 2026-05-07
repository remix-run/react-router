---
title: Using handle
---

# Using `handle`

[MODES: framework]

<br/>
<br/>

You can build dynamic UI elements like breadcrumbs based on your route hierarchy using the [`useMatches`][use-matches] hook and [`handle`][handle] route exports.

## Understanding the Basics

React Router provides access to all route matches and their data throughout your component tree. This allows routes to contribute metadata through the `handle` export that can be rendered by ancestor components.

The `useMatches` hook combined with `handle` exports enables routes to contribute to rendering processes higher up the component tree than their actual render point. While we'll use breadcrumbs as an example, this pattern works for any scenario where you need routes to provide additional information to their ancestors.

## Defining Route `handle`s

We'll use a route structure like the following:

```ts filename=app/routes.ts
import { route } from "@react-router/dev/routes";

export default [
  route("parent", "./routes/parent.tsx", [
    route("child", "./routes/child.tsx"),
  ]),
] satisfies RouteConfig;
```

Add a `breadcrumb` property to the "parent" route's `handle` export. You can name this property whatever makes sense for your use case.

```tsx filename=app/routes/parent.tsx
import { Link } from "react-router";

export const handle = {
  breadcrumb: () => <Link to="/parent">Some Route</Link>,
};
```

You can define breadcrumbs for child routes as well:

```tsx filename=app/routes/child.tsx
import { Link } from "react-router";

export const handle = {
  breadcrumb: () => (
    <Link to="/parent/child">Child Route</Link>
  ),
};
```

## Using Route `handle`s

Use the `useMatches` hook in your root layout or any ancestor component to collect and render the components defined in the `handle` export(s):

```tsx filename=app/root.tsx lines=[7,11,22-31]
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from "react-router";

export function Layout({ children }) {
  const matches = useMatches();

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <header>
          <ol>
            {matches
              .filter(
                (match) =>
                  match.handle && match.handle.breadcrumb,
              )
              .map((match, index) => (
                <li key={index}>
                  {match.handle.breadcrumb(match)}
                </li>
              ))}
          </ol>
        </header>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
```

The `match` object is passed to each breadcrumb function, giving you access to `match.data` (from loaders) and other route information to create dynamic breadcrumbs based on your route's data.

This pattern provides a clean way for routes to contribute metadata that can be consumed and rendered by ancestor components.

## Additional Resources

- [`useMatches`][use-matches]
- [`handle`][handle]

[use-matches]: ../api/hooks/useMatches
[handle]: ../start/framework/route-module#handle
