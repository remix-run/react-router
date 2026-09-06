---
title: Future Changes
order: 1
---

# Future Changes

We try our best to keep major version upgrades simple and boring through the use of opt-in APIs and [Future Flags][api-development-strategy]. Future flags are used to gate breaking changes that don't otherwise have a good call-site opt-in strategy. By adopting all opt-in APIs and future flags, you should be able to upgrade to the next major version of React Router with minimal changes.

We plan to ship new major versions roughly once a year as described in our [Open Governance Model][governance], so this guide will continue to track future changes you can adopt ahead of the next major release. v9 is currently estimated for mid-2027 when Node 22 reaches EOL.

We highly recommend you make a commit after each step and ship it instead of doing everything all at once. Most flags can be adopted in any order, with exceptions noted below.

<docs-info>This is an evolving document that will be updated throughout the duration of v8</docs-info>

## Minimum Versions

[MODES: framework, data, declarative]

<br/>
<br/>

React Router v9 will require the following minimum versions (as of now). You can prepare for the upgrade by updating them while still on v8:

- `node@24+`

## Update to latest v8.x

Before adopting any future flags or call-site opt-in changes, you should update to the latest minor version of v8.x to make sure you have access to the latest flags. You may see a number of deprecation warnings as you upgrade, which we'll cover below.

👉 Update to latest v8

```sh
npm install react-router@8 @react-router/{dev,node,etc.}@8
```

## Future Flags

_No future flags yet_

## Other Planned Breaking Changes

_No known planned breaking changes yet_

## Unstable Future Flags (Optional)

We document some [unstable] flags here as a reference for folks contributing to the project via beta testing, but they are not generally recommended for production use and may have breaking changes in patch or minor releases - adopt with caution!

### `future.unstable_enableNodeReadableStream`

[MODES: framework]

<br/>
<br/>

**Background**

Now that the Web Streams API is [stable](https://nodejs.org/docs/latest-v22.x/api/webstreams.html) in Node 22+, it's viable for React Router to use React's [`renderToReadableStream`](https://react.dev/reference/react-dom/server/renderToReadableStream) in the server entry.

When no `entry.server.tsx` file is present, React Router defaults to [`renderToPipeableStream`](https://react.dev/reference/react-dom/server/renderToPipeableStream) when a Node runtime is detected, and `renderToReadableStream` otherwise.

With this flag enabled, React Router will default to `renderToReadableStream` on all runtimes, including Node. You can continue to use `renderToPipeableStream` via a custom `entry.server.tsx` file if needed.

<docs-info>Enabling this flag might even provide slight performance gains because we are already using Web Streams internally, so this flag removes some unnecessary transforms between Web and Node streams.</docs-info>

👉 **Enable the Flag**

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    unstable_enableNodeReadableStream: true,
  },
} satisfies Config;
```

**Update your Code**

No code changes are required. If your app has a custom `entry.server.tsx`, this flag will not change your runtime behavior.

### `future.unstable_optimizeDeps`

[MODES: framework]

<br/>
<br/>

**Background**

This flag lets React Router provide Vite's dependency optimizer with the client entry file and route module files. This can improve dependency optimization in development, but the behavior is still experimental.

👉 **Enable the Flag**

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
```

**Update your Code**

No code changes are required. If you run into dependency optimization issues after enabling this flag, remove the flag and restart the dev server.

### `future.unstable_routeModuleTypes`

[MODES: framework]

<br/>
<br/>

**Background**

`unstable_useRoute` can give you the `handle`, `loaderData` and `actionData` types of _any_ route when you look it up by route ID. To do that, type generation has to write a route ID → route module map into `.react-router/types/+routes.ts`, which references every route module with `typeof import(...)`.

That file also augments the `react-router` module, and TypeScript treats every file that imports `react-router` as depending on it. Together, those two things form a cycle in TypeScript's file graph: `+routes.ts` → every route module → anything they import that also imports `react-router` → back to `+routes.ts`. `tsc` invalidates a dependency cycle as a single unit, so with `tsc --watch`, `tsc --incremental`, project references, or `emitDeclarationOnly`, changing the public shape of _one_ file re-checks _every_ route in the app. The cost grows with the size of your app.

Because of that, the route module map is no longer generated by default. `unstable_useRoute` still works without it at runtime, but a route ID argument is typed as `string` and the returned `handle`, `loaderData` and `actionData` come back as `unknown` rather than that route's types.

👉 **Enable the Flag**

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    unstable_routeModuleTypes: true,
  },
} satisfies Config;
```

**Update your Code**

If you call `unstable_useRoute` with a route ID, the returned `handle`, `loaderData` and `actionData` are now `unknown`, so code that reads fields off them no longer type-checks:

```tsx
import { unstable_useRoute as useRoute } from "react-router";

const product = useRoute("routes/product");

// with the flag:    `name` is typed from that route's loader
// without the flag: `loaderData` is `unknown`, so this is a type error
product?.loaderData?.name;
```

Route IDs are no longer checked either. Without the flag the argument is typed as `string`, so a mistyped route ID compiles and returns `undefined` at runtime.

Enable the flag to keep the precise types, and accept the type-checking cost described above. Leave it off if you don't call `unstable_useRoute` with a route ID.

### `future.unstable_routePatternMatching`

[MODES: data]

<br/>
<br/>

**Background**

This flag opts Data Routers into a new route matcher powered by [`@remix-run/route-pattern`](https://github.com/remix-run/remix/tree/main/packages/route-pattern). It supports the existing React Router path syntax and matching behavior, but ranks ambiguous matches by positional specificity instead of aggregate segment scores. This means a route with a longer static prefix can rank above a route with more dynamic segments.

👉 **Enable the Flag**

```ts
import { createBrowserRouter } from "react-router";

const router = createBrowserRouter(routes, {
  future: {
    unstable_routePatternMatching: true,
  },
});
```

The flag is also available with `createHashRouter` and `createMemoryRouter`.

**Update your Code**

No route configuration changes are required, but you should review any routes with overlapping patterns to ensure the new ranking behavior selects the intended route. This is mostly expected to be an issue when you have deep dynamic param paths which could result in an aggregate score that outweighs a shallower static segment route.

For example, both of these routes match `/products/one/two/three`:

```ts
const routes = [
  { path: "/products/*", id: "products" },
  {
    path: "/:first/:second/:third/:fourth",
    id: "segments",
  },
];
```

The legacy matcher selects `segments` based on its aggregate segment score. The new matcher selects `products` because its static `products` segment is more specific than the dynamic `:first` segment in the same position.

Once you enable this flag, use the `router.match()` when you need to match a location (this is currently marked private and will become stable at the same time this flag stabilizes). Standalone matching APIs such as `matchRoutes`, `matchPath`, and `useMatch` continue to use the legacy matcher and may return different matches than the router.

Case-sensitive routes are not currently supported with this flag.

[api-development-strategy]: ../community/api-development-strategy
[governance]: https://github.com/remix-run/react-router/blob/main/GOVERNANCE.md#design-goals
[unstable]: ../community/api-development-strategy#unstable-flags
