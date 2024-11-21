---
title: Special Files
---

# Special Files

There are a few special files that React Router looks for in your project. Not all of these files are required

## react-router.config.ts

**This file is optional**

The config file is used to configure certain aspects of your app, such as whether you are using server-side rendering, where certain directories are located, and more.

```tsx filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
} satisfies Config;
```

See the [config API](https://api.reactrouter.com/v7/types/_react_router_dev.config.Config.html) for more information.

## root.tsx

**This file is required**

The "root" route (`app/root.tsx`) is the only _required_ route in your React Router application because it is the parent to all routes in your `routes/` directory and is in charge of rendering the root `<html>` document.

Because the root route manages your document, it is the proper place to render a handful of "document-level" components React Router provides. These components are to be used once inside your root route and they include everything React Router figured out or built in order for your page to render properly.

```tsx filename=app/root.tsx
import type { LinksFunction } from "react-router";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import "./global-styles.css";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />

        {/* All `meta` exports on all routes will render here */}
        <Meta />

        {/* All `link` exports on all routes will render here */}
        <Links />
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

### Layout export

The root route supports all [route module exports][route-module].

The root route also supports an additional optional `Layout` export. The `Layout` component serves 2 purposes:

1. Avoid duplicating your document's "app shell" across your root component, `HydrateFallback`, and `ErrorBoundary`
2. Prevent React from re-mounting your app shell elements when switching between the root component/`HydrateFallback`/`ErrorBoundary` which can cause a FOUC if React removes and re-adds `<link rel="stylesheet">` tags from your `<Links>` component.

```tsx filename=app/root.tsx lines=[10-31]
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

## routes.ts

**This file is required**

The `routes.ts` file is used to configure which url patterns are matched to which route modules.

```tsx filename=app/routes.ts
import {
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  route("some/path", "./some/file.tsx"),
  // pattern ^           ^ module file
] satisfies RouteConfig;
```

See the [routing guide][routing] for more information.

## entry.client.tsx

**This file is optional**

By default, React Router will handle hydrating your app on the client for you. You can reveal the default entry client file with the following:

```shellscript nonumber
react-router reveal
```

This file is the entry point for the browser and is responsible for hydrating the markup generated by the server in your [server entry module][server-entry], however you can also initialize any other client-side code here.

```tsx filename=app/entry.client.tsx
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
```

This is the first piece of code that runs in the browser. You can initialize client side libraries, add client only providers, etc.

## entry.server.tsx

**This file is optional**

By default, React Router will handle generating the HTTP Response for you. You can reveal the default entry server file with the following:

```shellscript nonumber
react-router reveal
```

The `default` export of this module is a function that lets you create the response, including HTTP status, headers, and HTML, giving you full control over the way the markup is generated and sent to the client.

This module should render the markup for the current page using a `<ServerRouter>` element with the `context` and `url` for the current request. This markup will (optionally) be re-hydrated once JavaScript loads in the browser using the [client entry module][client-entry].

### `handleDataRequest`

You can export an optional `handleDataRequest` function that will allow you to modify the response of a data request. These are the requests that do not render HTML, but rather return the loader and action data to the browser once client-side hydration has occurred.

```tsx
export function handleDataRequest(
  response: Response,
  {
    request,
    params,
    context,
  }: LoaderFunctionArgs | ActionFunctionArgs
) {
  response.headers.set("X-Custom-Header", "value");
  return response;
}
```

### `handleError`

By default, React Router will log encountered server-side errors to the console. If you'd like more control over the logging, or would like to also report these errors to an external service, then you can export an optional `handleError` function which will give you control (and will disable the built-in error logging).

```tsx
export function handleError(
  error: unknown,
  {
    request,
    params,
    context,
  }: LoaderFunctionArgs | ActionFunctionArgs
) {
  if (!request.signal.aborted) {
    sendErrorToErrorReportingService(error);
    console.error(formatErrorForJsonLogging(error));
  }
}
```

_Note that you generally want to avoid logging when the request was aborted, since React Router's cancellation and race-condition handling can cause a lot of requests to be aborted._

### Streaming Rendering Errors

When you are streaming your HTML responses via [`renderToPipeableStream`][rendertopipeablestream] or [`renderToReadableStream`][rendertoreadablestream], your own `handleError` implementation will only handle errors encountered during the initial shell render. If you encounter a rendering error during subsequent streamed rendering you will need to handle these errors manually since the React Router server has already sent the Response by that point.

For `renderToPipeableStream`, you can handle these errors in the `onError` callback function. You will need to toggle a boolean in `onShellReady` so you know if the error was a shell rendering error (and can be ignored) or an async

For an example, please refer to the default [`entry.server.tsx`][node-streaming-entry-server] for Node.

**Thrown Responses**

Note that this does not handle thrown `Response` instances from your `loader`/`action` functions. The intention of this handler is to find bugs in your code which result in unexpected thrown errors. If you are detecting a scenario and throwing a 401/404/etc. `Response` in your `loader`/`action` then it's an expected flow that is handled by your code. If you also wish to log, or send those to an external service, that should be done at the time you throw the response.

[react-router-config]: https://api.reactrouter.com/v7/types/_react_router_dev.config.Config.html
[route-module]: ../start/framework/route-module
[routing]: ../start/framework/routing
[server-entry]: #entryservertsx
[client-entry]: #entryclienttsx
[rendertopipeablestream]: https://react.dev/reference/react-dom/server/renderToPipeableStream
[rendertoreadablestream]: https://react.dev/reference/react-dom/server/renderToReadableStream
[node-streaming-entry-server]: https://github.com/remix-run/react-router/blob/dev/packages/react-router-dev/config/defaults/entry.server.node.tsx
