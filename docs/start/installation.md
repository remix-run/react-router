---
title: Installation
order: 1
---

# Installation

## Starter Templates

Most projects start with a template. Let's use a basic template maintained by React Router with `degit`:

```shellscript nonumber
npx degit @remix-run/react-router/templates/basic#dev my-app
```

Now change into the new directory and start the app

```shellscript nonumber
cd my-app
npm i
npm run dev
```

You can now open your browser to `http://localhost:5173`

TODO: Show how to find and use community templates

## Manual Installation with Vite

First create a new directory and install dependencies:

```shellscript nonumber
mkdir my-new-app
cd my-new-app
npm init -y
npm install react react-dom react-router
npm install -D vite @react-router/dev
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
import {
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

export function Layout() {
  return (
    <html lang="en">
      <body>
        <Outlet />
        <ScrollRestoration />
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
import {
  type RouteConfig,
  index,
} from "@react-router/dev/routes";

export const routes: RouteConfig = [index("./home.tsx")];
```

```tsx filename=vite.config.ts
import react from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
});
```

And finally run the app:

```shellscript nonumber
npm run dev
```

## Without the Vite Plugin

React Router's full feature-set is easiest to use with the React Router Vite plugin, but you can also use React Router manually with your own bundling, server rendering, etc.

Refer to [Manual Usage][manual_usage] for more information.

[manual_usage]: ../guides/manual-usage
