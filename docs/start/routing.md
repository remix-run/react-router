---
title: Routing
order: 2
---

# Routing

## Route Config File

Routes are configured in `app/routes.ts`. The Vite plugin uses this file to create bundles for each route.

```ts filename=app/routes.ts
import {
  type RouteConfig,
  route,
  index,
  layout,
} from "@react-router/dev/routes";

export const routes: RouteConfig = [
  index("./home.tsx"),
  route("about", "./about.tsx"),

  layout("./auth/layout.tsx", [
    route("login", "./auth/login.tsx"),
    route("register", "./auth/register.tsx"),
  ]),

  route("concerts", [
    index("./concerts/home.tsx"),
    route(":city", "./concerts/city.tsx"),
    route("trending", "./concerts/trending.tsx"),
  ]),
];
```

## File System Routes

If you prefer to define your routes via file naming conventions rather than configuration, the `@react-router/fs-routes` package provides a [file system routing convention.][file-route-conventions]

```tsx filename=app/routes.ts
import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export const routes: RouteConfig = flatRoutes();
```

You can also mix routing conventions into a single array of routes.

```tsx filename=app/routes.ts
import {
  type RouteConfig,
  route,
} from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export const routes: RouteConfig = [
  // Provide file system routes
  ...(await flatRoutes()),

  // Then provide additional config routes
  route("/can/still/add/more", "./more.tsx"),
];
```

## Linking

Link to routes from your UI with `Link`

```tsx
import { Link } from "react-router";

function Header() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <Link
        to="/concerts/:id"
        params={{ id: "salt-lake-city" }}
      >
        Concerts
      </Link>
    </nav>
  );
}
```

## Nested Routes

Routes can be nested inside parent routes. Nested routes are rendered into their parent's [Outlet][outlet]

```ts filename=app/routes.ts
import {
  type RouteConfig,
  route,
  index,
} from "@react-router/dev/routes";

export const routes: RouteConfig = [
  route("dashboard", "./dashboard.tsx", [
    index("./home.tsx"),
    route("settings", "./settings.tsx"),
  ]),
];
```

```tsx filename=app/dashboard.tsx
import { Outlet } from "react-router";

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* will either be home.tsx or settings.tsx */}
      <Outlet />
    </div>
  );
}
```

## Layout Routes

Using `layout`, layout routes create new nesting for their children, but they don't add any segments to the URL. They can be added at any level.

```tsx filename=app/routes.ts lines=[9,15]
import {
  type RouteConfig,
  route,
  layout,
  index,
} from "@react-router/dev/routes";

export const routes: RouteConfig = [
  layout("./marketing/layout.tsx", [
    index("./marketing/home.tsx"),
    route("contact", "./marketing/contact.tsx"),
  ]),
  route("projects", [
    index("./projects/home.tsx"),
    layout("./projects/project-layout.tsx", [
      route(":pid", "./projects/project.tsx"),
      route(":pid/edit", "./projects/edit-project.tsx"),
    ]),
  ]),
];
```

## Index Routes

```ts
index(componentFile);
```

Index routes render into their parent's [Outlet][outlet] at their parent's URL (like a default child route).

```ts filename=app/routes.ts
import {
  type RouteConfig,
  route,
  index,
} from "@react-router/dev/routes";

export const routes: RouteConfig = [
  // renders into the root.tsx Outlet at /
  index("./home.tsx"),
  route("dashboard", "./dashboard.tsx", [
    // renders into the dashboard.tsx Outlet at /dashboard
    index("./dashboard-home.tsx"),
    route("settings", "./dashboard-settings.tsx"),
  ]),
];
```

Note that index routes can't have children.

## Dynamic Segments

If a path segment starts with `:` then it becomes a "dynamic segment". When the route matches the URL, the dynamic segment will be parsed from the URL and provided as `params` to other router APIs.

```ts filename=app/routes.ts
route("teams/:teamId", "./team.tsx");
```

```tsx filename=app/team.tsx
import type {
  LoaderArgs,
  ActionArgs,
  DefaultProps,
} from "./+types.team";

async function loader({ params }: LoaderArgs) {
  //                    ^? { teamId: string }
}

async function action({ params }: ActionArgs) {
  //                    ^? { teamId: string }
}

export default function Component({
  params,
}: DefaultProps) {
  console.log(params.teamId); // "hotspur"
}
```

You can have multiple dynamic segments in one route path:

```ts filename=app/routes.ts
route("c/:categoryId/p/:productId", "./product.tsx");
```

```tsx filename=app/product.tsx
import type { LoaderArgs } from "./+types.product";

async function loader({ params }: LoaderArgs) {
  //                    ^? { categoryId: string; productId: string }
}
```

## Optional Segments

You can make a route segment optional by adding a `?` to the end of the segment.

```ts filename=app/routes.ts
route(":lang?/categories", "./categories.tsx");
```

You can have optional static segments, too:

```ts filename=app/routes.ts
route("users/:userId/edit?", "./user.tsx");
```

## Splats

Also known as "catchall" and "star" segments. If a route path pattern ends with `/*` then it will match any characters following the `/`, including other `/` characters.

```ts filename=app/routes.ts
route("files/*", "./files.tsx");
```

```tsx filename=app/files.tsx
export async function loader({ params }) {
  // params["*"] will contain the remaining URL after files/
}
```

You can destructure the `*`, you just have to assign it a new name. A common name is `splat`:

```tsx
const { "*": splat } = params;
```

## Component Routes

You can also use components that match the URL to elements anywhere in the component tree:

```tsx
import { Routes, Route } from "react-router";

function Wizard() {
  return (
    <div>
      <h1>Some Wizard with Steps</h1>
      <Routes>
        <Route index element={<StepOne />} />
        <Route path="step-2" element={<StepTwo />} />
        <Route path="step-3" element={<StepThree />}>
      </Routes>
    </div>
  );
}
```

Note that these routes do not participate in data loading, actions, code splitting, or any other route module features, so their use cases are more limited than those of the route module.

[file-route-conventions]: ../misc/file-route-conventions
[outlet]: ../../api/react-router/Outlet
