---
title: Single Page App (SPA)
---

# Single Page App (SPA)

There are two ways to ship a single page app with React Router

- **as a library** - Instead of using React Router's framework features, you can use it as a library in your own SPA architecture. Refer to [React Router as a Library](../start/library/installation) guides.
- **as a framework** - This guide will focus here

## 1. Disable Server Rendering

Server rendering is enabled by default. Set the ssr flag to false in `react-router.config.ts` to disable it.

```ts filename=react-router.config.ts lines=[4]
import { type Config } from "@react-router/dev/config";

export default {
  ssr: false,
} satisfies Config;
```

With this set to false, the server build will no longer be generated.

## 2. Use client loaders and client actions

With server rendering disabled, you can still use `clientLoader` and `clientAction` to manage route data and mutations.

```tsx filename=some-route.tsx
import { Route } from "./+types/some-route";

export async function clientLoader(
  _: Route.ClientLoaderArgs
) {
  let data = await fetch("/some/api/stuff");
  return data;
}

export async function clientAction({
  request,
}: Route.ClientActionArgs) {
  let formData = await request.formData();
  return await processPayment(formData);
}
```

## 3. Pre-rendering

Pre-rendering can be configured for paths with static data known at build time for faster initial page loads. Refer to [Pre-rendering](./pre-rendering) to set it up.

## 4. Direct all URLs to index.html

After running `react-router build`, deploy the `build/client` directory to whatever static host you prefer.

Common to deploying any SPA, you'll need to configure your host to direct all URLs to the `index.html` of the client build. Some hosts do this by default, but others don't. As an example, a host may support a `_redirects` file to do this:

```
/*    /index.html   200
```

If you're getting 404s at valid routes for your app, it's likely you need to configure your host.

## Important Note

Typical Single Pages apps send a mostly blank index.html template with little more than an empty `<div id="root"></div>`.

In contrast `react-router build` (with server rendering disabled) pre-renders your root and index routes. This means you can:

- Send more than an empty div
- Use React components to generate the initial page users see
- Re-enable server rendering later without changing anything about your UI

This is also why your project still needs a dependency on `@react-router/node`.
