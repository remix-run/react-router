---
title: Automatic Code Splitting
---

# Automatic Code Splitting

When using React Router's framework features, your application is automatically code split to improve the performance of initial load times when users visit your application.

## Code Splitting by Route

Consider this simple route config:

```tsx filename=app/routes.ts
import {
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  route("/contact", "./contact.tsx"),
  route("/about", "./about.tsx"),
] satisfies RouteConfig;
```

Instead of bundling all routes into a single giant build, the modules referenced (`contact.tsx` and `about.tsx`) become entry points to the bundler.

Because these entry points are coupled to URL segments, React Router knows just from a URL which bundles are needed in the browser, and more importantly, which are not.

If the user visits `"/about"` then the bundles for `about.tsx` will be loaded but not `contact.tsx`. This ensures drastically reduces the JavaScript footprint for initial page loads and speeds up your application.

## Removal of Server Code

Any server-only [Route Module APIs][route-module] will be removed from the bundles. Consider this route module:

```tsx
export async function loader() {
  return { message: "hello" };
}

export async function action() {
  console.log(Date.now());
  return { ok: true };
}

export async function headers() {
  return { "Cache-Control": "max-age=300" };
}

export default function Component({ loaderData }) {
  return <div>{loaderData.message}</div>;
}
```

After building for the browser, only the `Component` will still be in the bundle, so you can use server-only code in the other module exports.

[route-module]: ../../start/framework/route-module
