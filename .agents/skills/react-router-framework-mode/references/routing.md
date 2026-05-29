---
title: Routing
description: Route configuration, nested routes, layouts, dynamic segments
tags: [routing, routes.ts, nested-routes, layout, dynamic-segments, params]
---

# Routing

For file conventions (`root.tsx`, `routes.ts`, etc.), see [special-files.md](./special-files.md).

If using `@react-router/fs-routes` see https://reactrouter.com/how-to/file-route-conventions

## Route Configuration

Routes are configured in `app/routes.ts`. Each route has a URL pattern and a file path to the route module:

```ts
import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("some/path", "./some/file.tsx"),
  // pattern ^           ^ module file
] satisfies RouteConfig;
```

### Complete Example

```ts
import {
  type RouteConfig,
  route,
  index,
  layout,
  prefix,
} from "@react-router/dev/routes";

export default [
  index("./home.tsx"),
  route("about", "./about.tsx"),

  layout("./auth/layout.tsx", [
    route("login", "./auth/login.tsx"),
    route("register", "./auth/register.tsx"),
  ]),

  ...prefix("concerts", [
    index("./concerts/home.tsx"),
    route(":city", "./concerts/city.tsx"),
    route("trending", "./concerts/trending.tsx"),
  ]),
] satisfies RouteConfig;
```

### Combining with File-Based Routes

```ts
import { type RouteConfig, route } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default [
  route("/", "./home.tsx"),
  ...(await flatRoutes()),
] satisfies RouteConfig;
```

## Route Helpers

| Helper                         | Purpose             | Adds URL segment? |
| ------------------------------ | ------------------- | ----------------- |
| `route(path, file, children?)` | Standard route      | Yes               |
| `index(file)`                  | Default child route | No                |
| `layout(file, children)`       | Shared UI wrapper   | No                |
| `prefix(path, children)`       | Path prefix only    | Yes               |

## Nested Routes

Child routes are passed as the third argument:

```ts
export default [
  route("dashboard", "./dashboard.tsx", [
    index("./dashboard-home.tsx"),
    route("settings", "./dashboard-settings.tsx"),
  ]),
] satisfies RouteConfig;
```

Parent path is automatically included: creates `/dashboard` and `/dashboard/settings`.

### Outlet

Child routes render through `<Outlet />` in the parent:

```tsx
import { Outlet } from "react-router";

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Outlet />
    </div>
  );
}
```

## Root Route

**Every route in `routes.ts` is nested inside `app/root.tsx`.** Put global navigation, footer, providers, and fonts there.

See [special-files.md](./special-files.md#roottsx-required) for `root.tsx` customization patterns.

## Layout Routes (Use Them!)

**Prefer nested routes over flat structures.** Layouts reduce code duplication and enable shared UI.

Create nesting without adding URL segments:

```ts
export default [
  layout("./marketing/layout.tsx", [
    index("./marketing/home.tsx"), // renders at /
    route("contact", "./marketing/contact.tsx"), // renders at /contact
  ]),
] satisfies RouteConfig;
```

Both routes render into `marketing/layout.tsx`'s `<Outlet />`.

### Anti-Pattern: Flat Routes

```ts
// ❌ DON'T: Flat structure with no shared layouts
export default [
  route("dashboard", "./dashboard.tsx"),
  route("dashboard/settings", "./dashboard-settings.tsx"),
  route("dashboard/profile", "./dashboard-profile.tsx"),
] satisfies RouteConfig;

// ✅ DO: Use nested routes with shared layout
export default [
  route("dashboard", "./dashboard/layout.tsx", [
    index("./dashboard/index.tsx"),
    route("settings", "./dashboard/settings.tsx"),
    route("profile", "./dashboard/profile.tsx"),
  ]),
] satisfies RouteConfig;
```

## Index Routes

Render at the parent's URL (default child):

```ts
export default [
  index("./home.tsx"), // renders at /
  route("dashboard", "./dashboard.tsx", [
    index("./dashboard-home.tsx"), // renders at /dashboard
    route("settings", "./settings.tsx"), // renders at /dashboard/settings
  ]),
] satisfies RouteConfig;
```

Index routes cannot have children.

## Route Prefixes

Add a path prefix without introducing a parent route:

```ts
export default [
  ...prefix("projects", [
    index("./projects/home.tsx"), // /projects
    route(":pid", "./projects/project.tsx"), // /projects/:pid
  ]),
] satisfies RouteConfig;
```

Equivalent to:

```ts
export default [
  route("projects", "./projects/home.tsx"),
  route("projects/:pid", "./projects/project.tsx"),
] satisfies RouteConfig;
```

## Dynamic Segments

Segments starting with `:` are dynamic and available via `params`:

```ts
route("teams/:teamId", "./team.tsx");
```

```tsx
import type { Route } from "./+types/team";

export async function loader({ params }: Route.LoaderArgs) {
  // params.teamId is typed as string
  return fetchTeam(params.teamId);
}

export default function Team({ params }: Route.ComponentProps) {
  return <h1>Team {params.teamId}</h1>;
}
```

Multiple dynamic segments:

```ts
route("c/:categoryId/p/:productId", "./product.tsx");
// params: { categoryId: string; productId: string }
```

## Optional Segments

Add `?` to make a segment optional:

```ts
route(":lang?/categories", "./categories.tsx");
// matches /categories and /en/categories

route("users/:userId/edit?", "./user.tsx");
// matches /users/123 and /users/123/edit
```

## Splats (Catch-All)

Match any remaining path with `/*`:

```ts
route("files/*", "./files.tsx");
```

```tsx
export async function loader({ params }: Route.LoaderArgs) {
  const filePath = params["*"]; // e.g., "docs/intro.md"
  return getFile(filePath);
}

// Destructure with rename
const { "*": splat } = params;
```

### 404 Catch-All

```ts
route("*", "./catchall.tsx");
```

```tsx
export function loader() {
  throw new Response("Page not found", { status: 404 });
}
```

## See Also

- [Route Module](./route-modules.md) - Route module exports
- [React Router Routing Documentation](https://reactrouter.com/start/framework/routing)
