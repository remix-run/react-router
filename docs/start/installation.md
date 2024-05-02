---
title: Installation
order: 1
---

# Installation

## Starter Templates

Most projects start with a template. The `react-router` CLI can create a very basic app:

```shellscript nonumber
npx react-router create my-new-app
```

Now change into the new directory and start the app

```shellscript nonumber
cd my-new-app
npm run dev
```

You can now open your browser to `http://localhost:3000`

TODO: Show how to find and use community templates

## Manual Installation with Vite

First create a new directory and install dependencies:

```shellscript nonumber
mkdir my-new-app
cd my-new-app
npm init -y
npm install react react-dom react-router-dom
npm install -D vite @react-router/vite
```

Now create the following files:

```shellscript nonumber
mkdir app
touch app/root.tsx
touch app/home.tsx
touch app/routes.ts
touch vite.config.ts
```

And then fill them in:

```tsx filename=app/root.tsx
import { Scripts, Outlet } from "react-router";

export function Layout() {
  return (
    <html lang="en">
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return <div>Loading...</div>;
}

export default function Root() {
  return <h1>Hello, world!</h1>;
}

export function ErrorBoundary() {
  return <h1>Something went wrong</h1>;
}
```

```tsx filename=app/home.tsx
export default function Home() {
  return <h2>Home</h2>;
}
```

```ts filename=app/routes.ts
import { createRoutes } from "react-router";

export const routes = createRoutes((route) => [
  route.index("./home.tsx"),
]);
```

```tsx filename=vite.config.ts
import { plugin as app } from "@react-router/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [app()],
});
```

And finally run the app:

```shellscript nonumber
react-router dev
```

## Using Webpack

TODO: update this when we know exactly what it looks like

You can also use the webpack plugin instead.

```shellscript nonumber
npm install -D webpack webpack-cli @react-router/webpack
```

```js filename=webpack.config.js
import { ReactRouterPlugin } from "@react-router/webpack";

export default {
  plugins: [new ReactRouterPlugin()],
};
```

And then run your app:

```shellscript nonumber
webpack dev
```

## Manual Usage

React Router's full feature set requires the bundler plugins but you can also use React Router manually and do your own bundling, server rendering, etc. Refer to the [manual usage][manual_usage] for more information.

[manual_usage]: ../guides/manual-usage
