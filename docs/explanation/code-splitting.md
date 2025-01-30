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

## Splitting Route Modules

<docs-info>

This feature is only enabled when setting the `unstable_splitRouteModules` future flag:

```tsx filename=react-router-config.ts
export default {
  future: {
    unstable_splitRouteModules: true,
  },
};
```

</docs-info>

One of the conveniences of the [Route Module API][route-module] is that everything a route needs is in a single file. Unfortunately this comes with a performance cost in some cases when using the `clientLoader`, `clientAction`, and `HydrateFallback` APIs.

As a basic example, consider this route module:

```tsx filename=routes/example.tsx
import { MassiveComponent } from "~/components";

export async function clientLoader() {
  return await fetch("https://example.com/api").then(
    (response) => response.json()
  );
}

export default function Component({ loaderData }) {
  return <MassiveComponent data={loaderData} />;
}
```

In this example we have a minimal `clientLoader` export that makes a basic fetch call, whereas the default component export is much larger. This is a problem for performance because it means that if we want to navigate to this route client-side, the entire route module must be downloaded before the client loader can start running.

To visualize this as a timeline:

<docs-info>In the following timeline diagrams, different characters are used within the Route Module bars to denote the different Route Module APIs being exported.</docs-info>

```
Get Route Module:  |--=======|
Run clientLoader:            |-----|
Render:                            |-|
```

Instead, we want to optimize this to the following:

```
Get clientLoader:  |--|
Get Component:     |=======|
Run clientLoader:     |-----|
Render:                     |-|
```

To achieve this optimization, React Router will split the route module into multiple smaller modules during the production build process. In this case, we'll end up with two separate [virtual modules][virtual-modules] — one for the client loader and one for the component and its dependencies.

```tsx filename=routes/example.tsx?route-chunk=clientLoader
export async function clientLoader() {
  return await fetch("https://example.com/api").then(
    (response) => response.json()
  );
}
```

```tsx filename=routes/example.tsx?route-chunk=main
import { MassiveComponent } from "~/components";

export default function Component({ loaderData }) {
  return <MassiveComponent data={loaderData} />;
}
```

<docs-info>This optimization is automatically applied in framework mode, but you can also implement it in library mode via `route.lazy` and authoring your route in multiple files as covered in our blog post on [lazy loading route modules.][blog-lazy-loading-routes]</docs-info>

Now that these are available as separate modules, the client loader and the component can be downloaded in parallel. This means that the client loader can be executed as soon as it's ready without having to wait for the component.

This optimization is even more pronounced when more Route Module APIs are used. For example, when using `clientLoader`, `clientAction` and `HydrateFallback`, the timeline for a single route module during a client-side navigation might look like this:

```
Get Route Module:     |--~~++++=======|
Run clientLoader:                     |-----|
Render:                                     |-|
```

This would instead be optimized to the following:

```
Get clientLoader:     |--|
Get clientAction:     |~~|
Get HydrateFallback:  SKIPPED
Get Component:        |=======|
Run clientLoader:        |-----|
Render:                        |-|
```

Note that this optimization only works when the Route Module APIs being split don't share code within the same file. For example, the following route module can't be split:

```tsx filename=routes/example.tsx
import { MassiveComponent } from "~/components";

const shared = () => console.log("hello");

export async function clientLoader() {
  shared();
  return await fetch("https://example.com/api").then(
    (response) => response.json()
  );
}

export default function Component({ loaderData }) {
  shared();
  return <MassiveComponent data={loaderData} />;
}
```

This route will still work, but since both the client loader and the component depend on the `shared` function defined within the same file, it will be de-optimized into a single route module.

To avoid this, you can extract any code shared between exports into a separate file. For example:

```tsx filename=routes/example/shared.tsx
export const shared = () => console.log("hello");
```

You can then import this shared code in your route module without triggering the de-optimization:

```tsx filename=routes/example/route.tsx
import { MassiveComponent } from "~/components";
import { shared } from "./shared";

export async function clientLoader() {
  shared();
  return await fetch("https://example.com/api").then(
    (response) => response.json()
  );
}

export default function Component({ loaderData }) {
  shared();
  return <MassiveComponent data={loaderData} />;
}
```

Since the shared code is in its own module, React Router is now able to split this route module into two separate virtual modules:

```tsx filename=routes/example/route.tsx?route-chunk=clientLoader
import { shared } from "./shared";

export async function clientLoader() {
  shared();
  return await fetch("https://example.com/api").then(
    (response) => response.json()
  );
}
```

```tsx filename=routes/example/route.tsx?route-chunk=main
import { MassiveComponent } from "~/components";
import { shared } from "./shared";

export default function Component({ loaderData }) {
  shared();
  return <MassiveComponent data={loaderData} />;
}
```

If your project is particularly performance sensitive, you can set the `unstable_splitRouteModules` future flag to `"enforce"`:

```tsx filename=react-router-config.ts
export default {
  future: {
    unstable_splitRouteModules: "enforce",
  },
};
```

This setting will raise an error if any route modules can't be split:

```
Error splitting route module: routes/example/route.tsx

- clientLoader

This export could not be split into its own chunk because it shares code with other exports. You should extract any shared code into its own module and then import it within the route module.
```

[route-module]: ../../start/framework/route-module
[virtual-modules]: https://vite.dev/guide/api-plugin#virtual-modules-convention
[blog-lazy-loading-routes]: https://remix.run/blog/lazy-loading-routes#advanced-usage-and-optimizations
