---
title: Adopting Vite (RouterProvider)
---

# Adopting Vite (RouterProvider)

If you are not using `<RouterProvider>` please see [Adopting Route Modules from Component Routes](./vite-component-routes) instead.

The React Router vite plugin adds framework features to React Router. This document wil help you adopt the plugin in your app if you'd like.

## Features

The Vite plugin adds:

- Route loaders, actions, and automatic data revalidation
- Typesafe Routes Modules
- Typesafe Route paths across your app
- Automatic route code-splitting
- Automatic scroll restoration across navigations
- Optional Static pre-rendering
- Optional Server rendering
- Optional React Server Components

The initial setup will likely be a bit of a pain, but once complete, adopting the new features is incremental, you can do one route at a time.

## 1. Install Vite

First install the React Router vite plugin:

```shellscript nonumber
npm install -D @react-router/dev
```

Then swap out the React plugin for React Router. The `react` key accepts the same options as the React plugin.

```diff filename=vite.config.ts
-import react from '@vitejs/plugin-react'
+import { plugin as app } from "@react-router/vite";
import { defineConfig } from "vite";


export default defineConfig({
  plugins: [
-    react(reactOptions)
+    app({ react: reactOptions })
  ],
});
```

## 2. Add the Root entry point

In a typical Vite app, the `index.html` file is the entry point for bundling. The React Router Vite plugin uses `root.tsx`. This let's you use React to render the shell instead of static HTML.

If your current `index.html` looks like this:

```html filename=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

You would move that markup into `src/root.tsx` and delete `index.html`:

```tsx filename=src/root.tsx
import {
  Scripts,
  Outlet,
  ScrollRestoration,
} from "react-router";

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>My App</title>
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

## 3. Add client entry module

In the typical Vite app setup the `index.html` file points to `src/main.tsx` as the client entry point. React Router uses a file named `src/entry.client.tsx`.

If your current `src/main.tsx` looks like this:

```tsx filename=src/main.tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter(YOUR_ROUTES);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
```

You would rename it to `entry.client.tsx` and change it to this:

```tsx filename=src/entry.client.tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import { HydratedRouter } from "react-router-dom";

ReactDOM.hydrateRoot(
  document,
  <StrictMode>
    <HydratedRouter routes={YOUR_ROUTES} />
  </StrictMode>
);
```

- Use `hydrateRoot` instead of `createRoot`
- Use `<HydratedRouter>` instead of `<RouterProvider>`
- Pass your routes to `<HydratedRouter>`

## 4. Shuffle stuff around

Between `root.tsx` and `entry.client.tsx`, you may want to shuffle some stuff around between them.

In general:

- `root.tsx` contains any rendering things like context providers, layouts, styles, etc.
- `entry.client.tsx` should be as minimal as possible

Note that your `root.tsx` file will be statically generated and served as the entry point of your app, so just that module will need to be compatible with server rendering. This is where most of your trouble will come.

## 5. Boot the app

At this point you should be able to to boot the app.

```shellscript
npm react-router vite:dev
```

If you're having trouble

- Comment out the `routes` prop to `<HydratedRouter>` to isolate the problem to the new entry points
- Search the [Upgrading Discussion](#TODO) category
- Reach out for help on [Twitter](https://x.com/remix_run) or [Discord](https://rmx.as/discord)

Make sure you can boot your app at this point before moving on.

## 6. Migrate a route to a Route Module

You can now incrementally migrate your routes to route modules. First create a `routes.ts` file that exports your routes.

Given an existing route like this:

```tsx filename=src/entry.client.tsx
// ...
import Page from "./containers/page";

ReactDOM.hydrateRoot(
  document,
  <StrictMode>
    <HydratedRouter
      routes={[
        // ...
        {
          path: "/pages/:id",
          element: <Page />,
        },
      ]}
    />
  </StrictMode>
);
```

You can move the definition to a `routes.ts` file:

```tsx filename=src/routes.ts
import { routes } from "@react-router/dev/routes";

export default routes([
  {
    path: "/pages/:id",
    file: "./containers/page.tsx",
  },
]);
```

And then edit the route module to use the Route Module API:

```tsx filename=src/pages/about.tsx
import { useLoaderData } from "react-router";

export async function clientLoader({ params }) {
  let page = await getPage(params.id);
  return page;
}

export default function Component() {
  let data = useLoaderData();
  return <h1>{data.title}</h1>;
}
```

You'll now get inferred type safety with params, loader data, and more.

The first few routes you migrate are the hardest because you often have to access the same abstractions a bit differently than before (like in a loader instead of from a hook or context). But once the trickiest bits get dealt with, you get into an incremental groove.

## Enable SSR and/or Pre-rendering

If you want to enable server rendering and static pre-rendering, you can do so with the `ssr` and `prerender` options in the bundler plugin. For SSR you'll need to also deploy the server build to a server. See [Deploying](./deploying) for more information.

```ts filename=vite.config.ts
import { plugin as app } from "@react-router/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    app({
      ssr: true,
      async prerender() {
        return ["/", "/pages/about"];
      },
    }),
  ],
});
```
