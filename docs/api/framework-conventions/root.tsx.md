---
title: root.tsx
order: 1
---

# root.tsx

[MODES: framework]

## Summary

<docs-info>
This file is required
</docs-info>

The "root" route (`app/root.tsx`) is the only _required_ route in your React Router application because it is the parent to all routes and is in charge of rendering the root `<html>` document.

```tsx filename=app/root.tsx
import { Outlet, Scripts } from "react-router";

import "./global-styles.css";

export default function App() {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
```

## Components to Render

Because the root route manages your document, it is the proper place to render a handful of "document-level" components React Router provides. These components are to be used once inside your root route and they include everything React Router figured out or built in order for your page to render properly.

```tsx filename=app/root.tsx
import {
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
      </head>
      <body>
        {/* Child routes render here */}
        <Outlet />

        {/* Manages scroll position for client-side transitions */}
        {/* If you use a nonce-based content security policy for scripts, you must provide the `nonce` prop. Otherwise, omit the nonce prop as shown here. */}
        <ScrollRestoration />

        {/* Script tags go here */}
        {/* If you use a nonce-based content security policy for scripts, you must provide the `nonce` prop. Otherwise, omit the nonce prop as shown here. */}
        <Scripts />
      </body>
    </html>
  );
}
```

If you are not on React 19 or choosing not to use React's [`<link>`][react-link], [`<title>`][react-title], and [`<meta>`][react-meta] components, and instead relying on React Router's [`links`][react-router-links] and [`meta`][react-router-meta] exports, you need to add the following to your root route:

```tsx filename=app/root.tsx
import { Links, Meta } from "react-router";

export default function App() {
  return (
    <html lang="en">
      <head>
        {/* All `meta` exports on all routes will render here */}
        <Meta />

        {/* All `link` exports on all routes will render here */}
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

## Layout Export

The root route supports all [route module exports][route-module].

The root route also supports an additional optional `Layout` export. The `Layout` component serves 2 purposes:

1. Avoid duplicating your document's "app shell" across your root component, `HydrateFallback`, and `ErrorBoundary`
2. Prevent React from re-mounting your app shell elements when switching between the root component/`HydrateFallback`/`ErrorBoundary` which can cause a FOUC if React removes and re-adds `<link rel="stylesheet">` tags from your `<Links>` component.

`Layout` takes a single `children` prop, which is the `default` export (e.g. `App`), `HydrateFallback`, or `ErrorBoundary`.

```tsx filename=app/root.tsx
export function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {/* children will be the root Component, ErrorBoundary, or HydrateFallback */}
        {children}
        <Scripts />
        <ScrollRestoration />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {}
```

**A note on `useLoaderData`in the `Layout` Component**

`useLoaderData` is not permitted to be used in `ErrorBoundary` components because it is intended for the happy-path route rendering, and its typings have a built-in assumption that the `loader` ran successfully and returned something. That assumption doesn't hold in an `ErrorBoundary` because it could have been the `loader` that threw and triggered the boundary! In order to access loader data in `ErrorBoundary`'s, you can use `useRouteLoaderData` which accounts for the loader data potentially being `undefined`.

Because your `Layout` component is used in both success and error flows, this same restriction holds. If you need to fork logic in your `Layout` depending on if it was a successful request or not, you can use `useRouteLoaderData("root")` and `useRouteError()`.

<docs-warn>Because your `<Layout>` component is used for rendering the `ErrorBoundary`, you should be _very defensive_ to ensure that you can render your `ErrorBoundary` without encountering any render errors. If your `Layout` throws another error trying to render the boundary, then it can't be used and your UI will fall back to the very minimal built-in default `ErrorBoundary`.</docs-warn>

```tsx filename=app/root.tsx lines=[6-7,19-29,32-34]
export function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = useRouteLoaderData("root");
  const error = useRouteError();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <Meta />
        <Links />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --themeVar: ${
                  data?.themeVar || defaultThemeVar
                }
              }
            `,
          }}
        />
      </head>
      <body>
        {data ? (
          <Analytics token={data.analyticsToken} />
        ) : null}
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

[route-module]: ../../start/framework/route-module
[react-link]: https://react.dev/reference/react-dom/components/link
[react-meta]: https://react.dev/reference/react-dom/components/meta
[react-title]: https://react.dev/reference/react-dom/components/title
[react-router-links]: ../../start/framework/route-module#links
[react-router-meta]: ../../start/framework/route-module#meta
