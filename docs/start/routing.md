---
title: Routing
order: 2
---

# Routing

Your routes are the foundation of React Router's features, they define:

- automatic code-splitting
- data loading
- actions
- revalidation
- error boundaries
- and more

The rest of the getting started guides will cover these features in more detail while this guide will give you a basic understanding of routing.

## Configuring Routes

Routes are configured in `app/routes.ts`. Routes have a url pattern to match the URL and a file path to the route module to define its behavior.

```tsx
import { route } from "@react-router/dev/routes";

export const routes = [
  route("some/path", "./some/file.tsx"),
  // pattern ^           ^ module file
];
```

Here is a larger sample route config:

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

If you prefer to define your routes via file naming conventions rather than configuration, the `@react-router/fs-routes` package provides a [file system routing convention.][file-route-conventions]

## Route Modules

The files referenced in `routes.ts` define each route's behavior:

```tsx filename=app/routes.ts
route("teams/:teamId", "./team.tsx"),
//           route module ^^^^^^^^
```

Here's a sample route module:

```tsx filename=app/team.tsx
// provides type safety/inference
import type * as Route from "./+types.team";

// provides `loaderData` to the component
export async function loader({ params }: Route.LoaderArgs) {
  let team = await fetchTeam(params.teamId);
  return { name: team.name };
}

// renders after the loader is done
export default function Component({
  loaderData,
}: Route.ComponentProps) {
  return <h1>{loaderData.name}</h1>;
}
```

Route modules have more features like actions, headers, and error boundaries, but they will be covered in later guides.

## Nested Routes

Routes can be nested inside parent routes.

```ts filename=app/routes.ts
import {
  type RouteConfig,
  route,
  index,
} from "@react-router/dev/routes";

export const routes: RouteConfig = [
  // parent route
  route("dashboard", "./dashboard.tsx", [
    // child routes
    index("./home.tsx"),
    route("settings", "./settings.tsx"),
  ]),
];
```

The path of the parent is automatically included in the child, so this config creates both `"/dashboard"` and `"/dashboard/settings"` URLs.

Child routes are rendered through the `<Outlet/>` in the parent route.

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

## Root Route

Every route in `routes.ts` is nested inside the special `app/root.tsx` module.

## Layout Routes

Using `layout`, layout routes create new nesting for their children, but they don't add any segments to the URL. It's like the root route but they can be added at any level.

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
index(componentFile),
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
route("teams/:teamId", "./team.tsx"),
```

```tsx filename=app/team.tsx
import type * as Route from "./+types.team";

export async function loader({ params }: Route.LoaderArgs) {
  //                           ^? { teamId: string }
}

export default function Component({
  params,
}: Route.ComponentProps) {
  params.teamId;
  //        ^ string
}
```

You can have multiple dynamic segments in one route path:

```ts filename=app/routes.ts
route("c/:categoryId/p/:productId", "./product.tsx"),
```

```tsx filename=app/product.tsx
import type * as Route from "./+types.product";

async function loader({ params }: LoaderArgs) {
  //                    ^? { categoryId: string; productId: string }
}
```

## Optional Segments

You can make a route segment optional by adding a `?` to the end of the segment.

```ts filename=app/routes.ts
route(":lang?/categories", "./categories.tsx"),
```

You can have optional static segments, too:

```ts filename=app/routes.ts
route("users/:userId/edit?", "./user.tsx");
```

## Splats

Also known as "catchall" and "star" segments. If a route path pattern ends with `/*` then it will match any characters following the `/`, including other `/` characters.

```ts filename=app/routes.ts
route("files/*", "./files.tsx"),
```

```tsx filename=app/files.tsx
export async function loader({ params }: Route.LoaderArgs) {
  // params["*"] will contain the remaining URL after files/
}
```

You can destructure the `*`, you just have to assign it a new name. A common name is `splat`:

```tsx
const { "*": splat } = params;
```

## Linking

Link to routes from your UI with `Link` and `NavLink`

```tsx
import { NavLink, Link } from "react-router";

function Header() {
  return (
    <nav>
      {/* NavLink makes it easy to show active states */}
      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive ? "active" : ""
        }
      >
        Home
      </NavLink>

      <Link to="/concerts/salt-lake-city">Concerts</Link>
    </nav>
  );
}
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
