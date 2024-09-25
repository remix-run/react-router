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
import { plugin as app } from "@react-router/vite";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [
    app({
      // defaults to false
      ssr: true,
    }),
  ],
});
```

Server side rendering requires a deployment that supports it. Though it's a global setting, individual routes can still be statically pre-rendered, and/or use client data loading with `clientLoader` to avoid server rendering/fetching of their portion of the UI.

## Static Pre-rendering

```ts filename=vite.config.ts
import { plugin as app } from "@react-router/vite";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [
    app({
      // return a list of URLs to prerender at build time
      async prerender() {
        return ["/", "/about", "/contact"];
      },
    }),
  ],
});
```

Pre-rendering is a build-time operation that generates static HTML and client navigation data payloads for a list of URLs. This is useful for SEO and performance, especially for deployments without server rendering. When pre-rendering, the `loader` method is used to fetch data at build time.

## React Server Components

<docs-warning>RSC is not supported yet, this is a future API that we plan to support</docs-warning>

You can return elements from loaders and actions to keep them out of browser bundles.

```tsx
export default defineRoute$({
  async loader() {
    return {
      products: <Products />,
      reviews: <Reviews />,
    };
  },

  Component({ data }) {
    return (
      <div>
        {data.products}
        {data.reviews}
      </div>
    );
  },
});
```
