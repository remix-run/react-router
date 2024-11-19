---
title: Framework Adoption from Component Routes
---

<docs-warning>This guide is mostly a stub and in active development, it will be wrong about many things before the final v7 release</docs-warning>

# Framework Adoption from Component Routes

If you are using `<RouterProvider>` please see [Framework Adoption from RouterProvider][upgrade-router-provider] instead.

If you are using `<Routes>` this is the right place.

The React Router Vite plugin adds framework features to React Router. This guide will help you adopt the plugin in your app. If you run into any issues, please reach out for help on [Twitter](https://x.com/remix_run) or [Discord](https://rmx.as/discord).

## Features

The Vite plugin adds:

- Route loaders, actions, and automatic data revalidation
- Typesafe Routes Modules
- Automatic route code-splitting
- Automatic scroll restoration across navigations
- Optional Static pre-rendering
- Optional Server rendering

The initial setup will likely be a bit of a pain, but once complete, adopting the new features is incremental, you can do one route at a time.

## Prerequisites

In order to use the Vite plugin, your project needs to be running

- Node.js 20+ (if using Node as your runtime)
- Vite 5+

## 1. Install the Vite plugin

First install the React Router Vite plugin:

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

## 2. Add the React Router config

Create a `react-router.config.ts` file in the root of your project. In this config you can tell React Router about your project, like where to find the app directory.

```shellscript nonumber
touch react-router.config.ts
```

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  ssr: false,
} satisfies Config;
```

## 3. Add the Root entry point

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

```shellscript nonumber
touch src/root.tsx
```

```tsx filename=src/root.tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

export function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>My App</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}
```

## 4. Add client entry module

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
  <React.StrictMode>
    <HydratedRouter />
  </React.StrictMode>
);
```

- Use `hydrateRoot` instead of `createRoot`
- Render a `<HydratedRouter>` instead of your `<App/>` component
- Note that we stopped rendering the `<App/>` component. We'll bring it back in a later step, for now we want to simply get the app booting with the new entry points.

## 5. Shuffle stuff around

Between `root.tsx` and `entry.client.tsx`, you may want to shuffle some stuff around between them.

In general:

- `root.tsx` contains any rendering things like context providers, layouts, styles, etc.
- `entry.client.tsx` should be as minimal as possible
- Remember to _not_ try to render your existing `<App/>` component yet, we'll do that in a later step

Note that your `root.tsx` file will be statically generated and served as the entry point of your app, so just that module will need to be compatible with server rendering. This is where most of your trouble will come.

## 6. Setup your routes

The React Router Vite plugin uses a `routes.ts` file to configure your routes. For now we'll add a simple catchall route to get things going.

```shellscript nonumber
touch src/routes.ts src/catchall.tsx
```

```ts filename=src/routes.ts
import {
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  route("*?", "catchall.tsx"),
] satisfies RouteConfig;
```

Eventually we'll replace this with our original `App` component, but for now we'll just render something simple to make sure we can boot the app.

```tsx filename=src/home.tsx
export default function Component() {
  return <div>Hello, world!</div>;
}
```

[View our guide on configuring routes][configuring-routes] to learn more about the `routes.ts` file.

## 7. Boot the app

At this point you should be able to to boot the app and see the root layout.

Add the following script to your `package.json` to boot the app:

```json filename=package.json
"scripts": {
  "dev": "react-router dev"
}
```

Now make sure you can boot your app at this point before moving on:

```shellscript
npm run dev
```

## 8. Configure Catchall Route

To get back to rendering your app, we'll update the "catchall" route we setup earlier that matches all URLs so that your existing `<Routes>` get a chance to render.

```tsx filename=src/catchall.tsx
import App from "./App";

export default function Component() {
  return <App />;
}
```

Your app should be back on the screen and working as usual!

Note: You will get some warnings in your console about descendent routes. You can ignore these for now, as we will be moving routes to Route Modules in the next step.

## 9. Migrate a route to a Route Module

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
import {
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  route("/pages/:id", "./containers/page.tsx"),
  route("*?", "catchall.tsx"),
] satisfies RouteConfig;
```

And then edit the route module to use the [Route Module API][route-modules]:

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
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  async prerender() {
    return ["/", "/about", "/contact"];
  },
} satisfies Config;
```

See [Deploying][deploying] for more information on deploying a server.

[upgrade-router-provider]: ./router-provider
[deploying]: ../start/deploying
[configuring-routes]: ../start/framework/routing
[route-modules]: ../start/framework/route-module
