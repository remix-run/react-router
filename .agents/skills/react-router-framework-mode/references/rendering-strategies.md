---
title: Rendering Strategies
description: SSR, SPA mode, and pre-rendering configuration
tags: [ssr, spa, prerender, rendering, react-router.config.ts]
---

# Rendering Strategies

React Router supports three rendering strategies, configured in `react-router.config.ts`.

## Server-Side Rendering (SSR)

Default mode. Pages are rendered on the server for each request:

```ts
// react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true, // default
} satisfies Config;
```

**How it works:**

1. Server runs loaders and renders HTML
2. HTML is sent to browser
3. Browser hydrates with JavaScript
4. Subsequent navigations are client-side

**When to use:**

- Dynamic content that changes per request
- SEO-critical pages
- Content that depends on user authentication

## Client-Side Rendering (SPA Mode)

Disable SSR for a single-page application:

```ts
// react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
} satisfies Config;
```

**How it works:**

1. Server sends minimal HTML shell
2. Browser loads JavaScript
3. JavaScript renders the app and fetches data

**When to use:**

- Apps behind authentication (no SEO needed)
- Dashboards and admin panels
- When you can't run a Node.js server

In SPA mode, use `clientLoader` instead of `loader`:

```tsx
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const res = await fetch(`/api/products/${params.id}`);
  return res.json();
}
```

## Static Pre-rendering

Generate static HTML at build time:

```ts
// react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  prerender: true, // Pre-render all static routes
} satisfies Config;
```

### Pre-render Specific Paths

```ts
export default {
  ssr: true,
  prerender: ["/", "/about", "/pricing"],
} satisfies Config;
```

### Pre-render Dynamic Paths

Use an async function:

```ts
export default {
  ssr: true,
  async prerender() {
    const products = await db.getAllProducts();
    return ["/", "/about", ...products.map((p) => `/products/${p.id}`)];
  },
} satisfies Config;
```

**How it works:**

1. At build time, routes are rendered to static HTML
2. Static HTML files are deployed
3. Browser hydrates with JavaScript
4. Subsequent navigations are client-side

**When to use:**

- Marketing pages, blogs, documentation
- Content that doesn't change per request
- Maximum performance and CDN caching

## SPA Fallback

When using `ssr: false`, a fallback HTML file is generated for routes not pre-rendered:

```ts
export default {
  ssr: false,
  prerender: ["/", "/about"], // These are pre-rendered
  // Other routes use the SPA fallback
} satisfies Config;
```

## Mixing Strategies

You can combine pre-rendering with SSR:

```ts
export default {
  ssr: true,
  prerender: ["/", "/about", "/pricing"],
  // Other routes are server-rendered
} satisfies Config;
```

Pre-rendered routes serve static HTML. Other routes are rendered on the server.

## Route-Level Data Loading

The rendering strategy affects which loaders run where:

| Strategy   | `loader`                                   | `clientLoader`        |
| ---------- | ------------------------------------------ | --------------------- |
| SSR        | Server on first load, server on navigation | Browser (optional)    |
| SPA        | Never runs                                 | Browser always        |
| Pre-render | Build time                                 | Browser on navigation |

## Configuration Reference

```ts
import type { Config } from "@react-router/dev/config";

export default {
  // Enable/disable server rendering
  ssr: true,

  // Pre-render routes at build time
  prerender: true | string[] | (() => Promise<string[]>),

  // Base path for the app
  basename: "/app",

  // Build directory
  buildDirectory: "build",

} satisfies Config;
```
