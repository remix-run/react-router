---
title: Rendering Strategies
order: 4
---

# Rendering Strategies

There are three rendering strategies in React Router:

- Client Side Rendering
- Server Side Rendering
- Static Pre-rendering

All routes are always client side rendered as the user navigates around the app. However, you can control server rendering and static pre-rendering with the `ssr` and `prerender` options in the Vite plugin.

## Server Side Rendering

```ts filename=vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    reactRouter({
      // defaults to false
      ssr: true,
    }),
  ],
});
```

Server side rendering requires a deployment that supports it. Though it's a global setting, individual routes can still be statically pre-rendered, and/or use client data loading with `clientLoader` to avoid server rendering/fetching of their portion of the UI.

## Static Pre-rendering

```ts filename=vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    reactRouter({
      // return a list of URLs to prerender at build time
      async prerender() {
        return ["/", "/about", "/contact"];
      },
    }),
  ],
});
```

Pre-rendering is a build-time operation that generates static HTML and client navigation data payloads for a list of URLs. This is useful for SEO and performance, especially for deployments without server rendering. When pre-rendering, route module loaders are used to fetch data at build time.

## React Server Components

<docs-warning>RSC is still in development</docs-warning>

In the future you will be able to return elements from loaders and actions to keep them out of browser bundles.

```tsx
export async function loader() {
  return {
    products: <Products />,
    reviews: <Reviews />,
  };
}

export default function App({ data }) {
  return (
    <div>
      {data.products}
      {data.reviews}
    </div>
  );
}
```
