---
title: Type Safety
---

# Type Safety

If you haven't done so already, check out our guide for [setting up type safety][route-module-type-safety] in a new project.

React Router generates types for each route in your app to provide type safety for the route module exports.

For example, let's say you have a `products/:id` route configured:

```ts filename=app/routes.ts
import {
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  route("products/:id", "./routes/product.tsx"),
] satisfies RouteConfig;
```

You can import route-specific types like so:

```tsx filename=app/routes/product.tsx
import type { Route } from "./+types/product";
// types generated for this route 👆

export function loader({ params }: Route.LoaderArgs) {
  //                      👆 { id: string }
  return { planet: `world #${params.id}` };
}

export default function Component({
  loaderData, // 👈 { planet: string }
}: Route.ComponentProps) {
  return <h1>Hello, {loaderData.planet}!</h1>;
}
```

## How it works

React Router's type generation executes your route config (`app/routes.ts` by default) to determine the routes for your app.
It then generates a `+types/<route file>.d.ts` for each route within a special `.react-router/types/` directory.
With [`rootDirs` configured][route-module-type-safety], TypeScript can import these generated files as if they were right next to their corresponding route modules.

For a deeper dive into some of the design decisions, check out our [type inference decision doc](https://github.com/remix-run/react-router/blob/dev/decisions/0012-type-inference.md).

[route-module-type-safety]: ../how-to/route-module-type-safety

## `typegen` command

You can manually generate types with the `typegen` command:

```sh
react-router typegen
```

The following types are generated for each route:

- `LoaderArgs`
- `ClientLoaderArgs`
- `ActionArgs`
- `ClientActionArgs`
- `HydrateFallbackProps`
- `ComponentProps` (for the `default` export)
- `ErrorBoundaryProps`

### --watch

If you run `react-router dev` — or if your custom server calls `vite.createServer` — then React Router's Vite plugin is already generating up-to-date types for you.
But if you really need to run type generation on its own, you can also use `--watch` to automatically regenerate types as files change:

```sh
react-router typegen --watch
```
