---
title: Framework Adoption from RouterProvider
---

<docs-warning>

This guide is mostly a stub and in active development, it will be wrong about many things before the final v7 release

<!-- TODO: remove these links, there just here in the meantime until this doc is updated -->

Checkout this <a href="https://github.com/brophdawg11/react-router-v6-to-v7-upgrade">example repo</a> and <a href="https://www.youtube.com/live/Vjau1QeTAPg">livestream</a> for a walkthrough of what an upgrade process might look like.

</docs-warning>

# Framework Adoption from RouterProvider

If you are not using `<RouterProvider>` please see [Framework Adoption from Component Routes][upgrade-component-routes] instead.

The React Router Vite plugin adds framework features to React Router. This guide will help you adopt the plugin in your app. If you run into any issues, please reach out for help on [Twitter](https://x.com/remix_run) or [Discord](https://rmx.as/discord).

## Features

The Vite plugin adds:

- Route loaders, actions, and automatic data revalidation
- Typesafe Routes Modules
- Automatic route code-splitting
- Automatic scroll restoration across navigations
- Optional Static pre-rendering
- Optional Server rendering

The initial setup requires the most work. However, once complete, you can adopt new features incrementally, one route at a time.

## Prerequisites

In order to use the Vite plugin, your project needs to be running

- Node.js 20+ (if using Node as your runtime)
- Vite 5+

## 1. Move route definitions into route modules

The React Router Vite plugin renders it's own `RouterProvider`, so we can't render an existing `RouterProvider` within it. Instead you will need to format all of your route definitions to follow the [Route Module API][route-modules].

This exercise will take the longest, however there are several benefits to doing this even before you enable the React Router Vite plugin.

- Route modules will be lazy loaded, decreasing the initial bundle size of your app
- Route definitions will be uniform, simplifying your app's architecture
- Moving to route modules is incremental, you can do one route at a time

**👉 Move your route definitions into route modules**

Export each piece of your route definition as a separate named export, following the [Route Module API][route-modules].

```tsx filename=src/routes/about.tsx
export async function clientLoader() {
  return {
    title: "About",
  };
}

export default function About() {
  let data = useLoaderData();
  return <div>{data.title}</div>;
}
```

**👉 Create a convert function**

Create a helper function to convert route module definitions into the format expected by your data router:

```tsx filename=src/main.tsx
function convert(m: any) {
  let {
    clientLoader,
    clientAction,
    default: Component,
    ...rest
  } = m;
  return {
    ...rest,
    loader: clientLoader,
    action: clientAction,
    Component,
  };
}
```

**👉 Lazy load and convert your route modules**

Instead of importing your route modules directly, you'll lazy load them and convert them to the format expected by your data router. Not only does your route definition now conform to the Route Module API, but you also get the benefits of code-splitting your routes.

```diff filename=src/main.tsx
let router = createBrowserRouter([
  // ... other routes
  {
    path: "about",
-   loader: aboutLoader,
-   Component: About,
+   lazy: () => import("./routes/about").then(convert),
  },
  // ... other routes
]);
```

## 2. Install the Vite plugin

Once all of your route definitions are converted to route modules, you can adopt the React Router Vite plugin.

**👉 Install the React Router Vite plugin**

```shellscript nonumber
npm install -D @react-router/dev
```

**👉 Install a runtime adapter**

We will assume you are using Node as your runtime.

```shellscript nonumber
npm install @react-router/node
```

**👉 Swap out the React plugin for React Router**

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

## 3. Add the React Router config

**👉 Create a `react-router.config.ts` file**

Add the following to the root of your project. In this config you can tell React Router about your project, like where to find the app directory and to not use SSR (server-side rendering) for now.

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

## 4. Add the Root entry point

In a typical Vite app, the `index.html` file is the entry point for bundling. The React Router Vite plugin moves the entry point to a `root.tsx` file so you can use React to render the shell of your app instead of static HTML, and eventually upgrade to Server Rendering if you want.

**👉 Move your existing `index.html` to `root.tsx`**

For example, if your current `index.html` looks like this:

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

**👉 Move everything above `RouterProvider` to `root.tsx`**

Any global styles, context providers, etc. should be moved into `root.tsx` so they can be shared across all routes.

For example, if your `App.tsx` looks like this:

```tsx filename=src/App.tsx
import "./index.css";

export default function App() {
  return (
    <OtherProviders>
      <AppLayout>
        <RouterProvider router={router} />
      </AppLayout>
    </OtherProviders>
  );
}
```

You would move everything above the `RouterProvider` into `root.tsx`.

```diff filename=src/root.tsx
+import "./index.css";

// ... other imports and Layout

export default function Root() {
  return (
+   <OtherProviders>
+     <AppLayout>
        <Outlet />
+     </AppLayout>
+   </OtherProviders>
  );
}
```

## 5. Migrate your routes

The React Router Vite plugin uses a `routes.ts` file to configure your routes. The format will be pretty similar to the definitions of your data router.

**👉 Move definitions to a `routes.ts` file**

```shellscript nonumber
touch src/routes.ts src/catchall.tsx
```

Take your route definitions and move them into the `routes.ts` file.

```tsx filename=src/main.tsx
const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("./routes/layout").then(convert),
    children: [
      {
        index: true,
        lazy: () => import("./routes/home").then(convert),
      },
      {
        path: "about",
        lazy: () => import("./routes/about").then(convert),
      },
      {
        path: "todos",
        lazy: () => import("./routes/todos").then(convert),
        children: [
          {
            path: ":id",
            lazy: () =>
              import("./routes/todo").then(convert),
          },
        ],
      },
    ],
  },
]);
```

At this point, if you're using TypeScript, you'll see that the formats don't match exactly. Updating them is straightforward.

```tsx filename=src/routes.ts
import type { RouteConfig } from "@react-router/dev/routes";

export default [
  {
    path: "/",
    lazy: () => import("./routes/layout").then(convert),
    children: [
      {
        index: true,
        lazy: () => import("./routes/home").then(convert),
      },
      {
        path: "about",
        lazy: () => import("./routes/about").then(convert),
      },
      {
        path: "todos",
        lazy: () => import("./routes/todos").then(convert),
        children: [
          {
            path: ":id",
            lazy: () =>
              import("./routes/todo").then(convert),
          },
        ],
      },
    ],
  },
] satisfies RouteConfig;
```

```diff filename=src/routes.ts
export default [
  {
    path: "/",
-   lazy: () => import("./routes/layout").then(convert),
+   file: "./routes/layout.tsx",
    children: [
      {
        index: true,
-       lazy: () => import("./routes/home").then(convert),
+       file: "./routes/home.tsx",
      },
      {
        path: "about",
-       lazy: () => import("./routes/about").then(convert),
+       file: "./routes/about.tsx",
      },
      {
        path: "todos",
-       lazy: () => import("./routes/todos").then(convert),
+       file: "./routes/todos.tsx",
        children: [
          {
            path: ":id",
-           lazy: () => import("./routes/todo").then(convert),
+           file: "./routes/todo.tsx",
          },
        ],
      },
    ],
  },
] satisfies RouteConfig;
```

[View our guide on configuring routes][configuring-routes] to learn more about the `routes.ts` file and helper functions to further simplify the route definitions.

## 7. Boot the app

At this point you should be fully migrated to the React Router Vite plugin. Go ahead and update your `dev` script and run the app to make sure everything is working.

**👉 Add `dev` script and run the app**

```json filename=package.json
"scripts": {
  "dev": "react-router dev"
}
```

Now make sure you can boot your app at this point before moving on:

```shellscript
npm run dev
```

## Enable SSR and/or Pre-rendering

If you want to enable server rendering and static pre-rendering, you can do so with the `ssr` and `prerender` options in the bundler plugin. For SSR you'll need to also deploy the server build to a server. See [Deploying][deploying] for more information.

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  async prerender() {
    return ["/", "/about", "/contact"];
  },
} satisfies Config;
```

[upgrade-component-routes]: ./component-routes
[deploying]: ../start/deploying
[configuring-routes]: ../start/framework/routing
[route-modules]: ../start/framework/route-module
[type-safety]: ../how-to/route-module-type-safety
