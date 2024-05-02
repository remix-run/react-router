---
title: Routing
order: 2
---

# Routing

Routes are configured in `app/routes.ts`. The bundler plugin will automatically pick up this file and use it to generate your routes.

Route modules are automatically code-split. See the [Code Splitting][code_splitting] discussion for details.

```ts filename=app/routes.ts
import { createRoutes } from "react-router-dom/routes";

export const routes = createRoutes((route) => [
  route.index("./home.tsx"),
  route("about", "./about.tsx"),

  route.layout("./auth/layout.tsx", () => [
    route("login", "./auth/login.tsx"),
    route("register", "./auth/register.tsx"),
  ]),

  route("concerts", [
    route.index("./concerts/home.tsx"),
    route(":city", "./concerts/city.tsx"),
    route("trending", "./concerts/trending.tsx"),
  ]),
]);
```

The `route` function and methods have the following signatures:

```ts
route(pattern, componentFile, childrenFunction);
route.index(componentFile);
route.layout(componentFile, childrenFunction);
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
      <Link to="/concerts">Concerts</Link>
    </nav>
  );
}
```

## Nested Routes

Routes can be nested inside parent routes. Nested routes are rendered into their parent's [Outlet][outlet]

```ts filename=app/routes.ts
route("dashboard", "./dashboard.tsx", () => [
  route.index("./home.tsx"),
  route("settings", "./settings.tsx"),
]);
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

```ts
route.layout(componentFile, childrenFunction);
```

Using `route.layout`, layout routes create new nesting for their children, but they don't add any segments to the URL. They can be added at any level.

```tsx filename=app/routes.ts
export const routes = createRoutes((route) => [
  route.layout("./marketing/layout.tsx", () => [
    route.index("./marketing/home.tsx"),
    route("contact", "./marketing/contact.tsx"),
  ]),
  route("projects", () => [
    route.index("./projects/home.tsx"),
    route.layout("./projects/project-layout.tsx", () => [
      route(":pid", "./projects/project.tsx"),
      route(":pid/edit", "./projects/edit-project.tsx"),
    ]),
  ]),
]);
```

## Index Routes

```ts
route.index(componentFile);
```

Index routes render into their parent's [Outlet][outlet] at their parent's URL (like a default child route).

```ts filename=app/routes.ts
export const routes = createRoutes((route) => [
  // renders into the root.tsx Outlet at /
  route.index("./home.tsx"),
  route("dashboard", "./dashboard.tsx", () => [
    // renders into the dashboard.tsx Outlet at /dashboard
    route.index("./dashboard-home.tsx"),
    route("settings", "./dashboard-settings.tsx"),
  ]),
]);
```

Note that index routes can't have children.

## Dynamic Segments

If a path segment starts with `:` then it becomes a "dynamic segment". When the route matches the URL, the dynamic segment will be parsed from the URL and provided as `params` to other router APIs.

```ts filename=app/routes.ts
route("teams/:teamId", "./team.tsx");
```

```tsx filename=app/team.tsx
export async function loader({ params }) {
  // params.teamId will be available
}

export async function clientLoader({ params }) {
  // params.teamId will be available
}

export async function action({ params }) {
  // params.teamId will be available
}

function Team() {
  let params = useParams();
  console.log(params.teamId); // "hotspur"
}
```

You can have multiple dynamic segments in one route path:

```ts filename=app/routes.ts
route("c/:categoryId/p/:productId", "./product.tsx");
```

```tsx filename=app/product.tsx
export async function loader({ params }) {
  // params.categoryId and params.productId will be available
}
```

Dynamic segments cannot be "partial":

- 🚫 `"/teams-:teamId"`
- ✅ `"/teams/:teamId"`
- 🚫 `"/:category--:productId"`
- ✅ `"/:productSlug"`

You can still support URL patterns like that, you just have to do a bit of your own parsing:

```tsx
export async function loader() {
  const { productSlug } = useParams();
  const [category, product] = productSlug.split("--");
  // ...
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

## Case Sensitive Routes

You can make your routes case sensitive with an optional third argument to `createRoutes`

```ts filename=app/routes.ts
import { createRoutes } from "react-router-dom/routes";

export const routes = createRoutes(
  (route) => [
    // routes here
  ],
  { caseSensitive: true }
);
```

- Will match `"wEll-aCtuA11y"`
- Will not match `"well-actua11y"`

## File System Routes

Since we've never met or created a file system routing convention we loved, we recommend sticking with `routes.ts`. This avoids inscrutable file names and allows you to organize your code however you like.

However, if you prefer file system routes, you can use the `fsRoutes` function to automatically create routes from the file system, and use it as inspiration to create your own convention if you'd like.

```tsx filename=app/routes.ts
import { createRoutes } from "react-router-dom/routes";
import { fsRoutes } from "@react-router/fs-routes";

export const routes = createRoutes((route) => [
  ...fsRoutes(route, "./routes"),
  // can still add other routes manually  here
]);
```

To learn the esoteric details of file system routes, see [Route File Naming][route_file_naming] doc.

## Component Routes

You can also use components that match the URL to render a route tree.

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

Note that these routes do not participate in data loading, actions, code splitting, or any other route module features.

See [Component Routes][component_routes] for more information.

[route_file_naming]: ../file-conventions/routes
[outlet]: ../components/outlet
[component_routes]: ../guides/component-routes
[code_splitting]: ../discussion/code-splitting
