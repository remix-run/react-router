---
title: Adopting Vite (Routes)
---

# Adopting Vite (Routes)

If you are using `<RouterProvider>` please see [Adopting Route Modules from RouterProvider](./vite-router-provider) instead.

If you are using `<Routes>` this is the right place.

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

Then swap out the React plugin for React Router.

```diff filename=vite.config.ts
-import react from '@vitejs/plugin-react'
+import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";


export default defineConfig({
  plugins: [
-    react()
+    reactRouter()
  ],
});
```

## 2. Add the Root entry point

In a typical Vite app, the `index.html` file is the entry point for bundling. The React Router Vite plugin moves the entry point to a `root.tsx` file so you can use React to render the shell of your app instead of static HTML, and eventually upgrade to Server Rendering if you want.

For example, if your current `index.html` looks like this:

```html filename="index.html"
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

In the typical Vite app setup the `index.html` file points to `src/main.tsx` as the client entry point. React Router uses a file named `src/entry.client.tsx` instead.

If your current `src/main.tsx` looks like this:

```tsx filename=src/main.tsx
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

You would rename it to `entry.client.tsx` and have it look like this:

```tsx filename=src/entry.client.tsx
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

ReactDOM.hydrateRoot(
  document,
  <StrictMode>
    <HydratedRouter />
  </StrictMode>
);
```

- Use `hydrateRoot` instead of `createRoot`
- Render a `<HydratedRouter>` instead of your `<App/>` component
- Note that we stopped rendering the `<App/>` component, it'll come back in a later step, for now we want to simply get the app booting with the new entry points.

## 4. Shuffle stuff around

Between `root.tsx` and `entry.client.tsx`, you may want to shuffle some stuff around between them.

In general:

- `root.tsx` contains any rendering things like context providers, layouts, styles, etc.
- `entry.client.tsx` should be as minimal as possible
- Remember to _not_ try to render your existing `<App/>` component so isolate steps

Note that your `root.tsx` file will be statically generated and served as the entry point of your app, so just that module will need to be compatible with server rendering. This is where most of your trouble will come.

## 5. Boot the app

At this point you should be able to to boot the app and see the root layout.

```shellscript
npm react-router vite:dev
```

- Search the [Upgrading Discussion](#TODO) category
- Reach out for help on [Twitter](https://x.com/remix_run) or [Discord](https://rmx.as/discord)

Make sure you can boot your app at this point before moving on.

## 6. Configure Catchall Route

To get back to rendering your app, we'll configure a "catchall" route that matches all URLs so that your existing `<Routes>` get a chance to render.

Create a file at `src/routes.ts` and add this:

```ts filename=src/routes.ts
import { type RouteConfig } from "@react-router/dev/routes";

export const routes: RouteConfig = [
  {
    path: "*",
    file: "src/catchall.tsx",
  },
];
```

And then create the catchall route module and render your existing root App component within it.

```tsx filename=src/catchall.tsx
import App from "./App";

export default function Component() {
  return <App />;
}
```

Your app should be back on the screen and working as usual!

## 6. Migrate a route to a Route Module

You can now incrementally migrate your routes to route modules.

Given an existing route like this:

```tsx filename=src/App.tsx
// ...
import Page from "./containers/page";

export default function App() {
  return (
    <Routes>
      <Route path="/pages/:id" element={<Page />} />
    </Routes>
  );
}
```

You can move the definition to a `routes.ts` file:

```tsx filename=src/routes.ts
import { type RouteConfig } from "@react-router/dev/routes";

export const routes: RouteConfig = [
  {
    path: "/pages/:id",
    file: "./containers/page.tsx",
  },
  {
    path: "*",
    file: "src/catchall.tsx",
  },
];
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

The first few routes you migrate are the hardest because you often have to access various abstractions a bit differently than before (like in a loader instead of from a hook or context). But once the trickiest bits get dealt with, you get into an incremental groove.

## Enable SSR and Pre-rendering

If you want to enable server rendering and static pre-rendering, you can do so with the `ssr` and `prerender` options in the bundler plugin.

```ts filename=vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    reactRouter({
      ssr: true,
      async prerender() {
        return ["/", "/about", "/contact"];
      },
    }),
  ],
});
```

See [Deploying][deploying] for more information on deploying a server.

[deploying]: ../start/deploying
