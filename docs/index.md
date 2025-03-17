---
title: React Router Home
order: 1
---

# React Router Home

React Router is a multi-strategy router for React bridging the gap from React 18 to React 19. You can use it maximally as a React framework or as minimally as you want.

The router at the top of your app determines which features are available to the rest of the APIs. Each mode builds upon the previous to let you use as much or as little as you like.

- **Declarative**: minimalist usage, just URL matching, active states, and navigating. Classic and clean. If you're using `<BrowserRouter>`, you're using declarative routing.
- **Data**: Everything from declarative but adds data features like loaders, actions, and pending states. If you're using `createBrowserRouter`, you're using data.
- **Framework**: Let React Router do it all with efficient bundling, code splitting, server rendering, and advanced type safety. If you're using `routes.ts`, you're using the framework.

## Declarative

[Get Started](./start/library/installation) with Declarative routing.

Like previous versions, React Router can still be used as a simple, declarative routing library. Its only job will be matching the URL to a set of components, providing access to URL data, and navigating around the app.

This strategy is popular for "Single Page Apps" that have their own frontend infrastructure and v6 apps looking for a stress free upgrade.

It's particularly good at offline + sync architectures where pending states are rare and users have long running sessions. Framework features like pending states, code splitting, server rendering, SEO, and initial page load times can be traded out for instant local-first interactions.

```tsx
ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="dashboard" element={<Dashboard />}>
        <Route index element={<RecentActivity />} />
        <Route path="project/:id" element={<Project />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
```

## Data

[Get Started](./start/library/installation) building a custom framework with a data router.

The framework features are built on top of lower-level APIs in React Router. You can use these APIs directly for a lighter-weight usage of React Router, but you'll need to set up your own bundling and server rendering (if you want it).

Some of the features include:

- Data loading with route loaders
- Data mutations with actions
- Concurrent mutations with fetchers
- Race condition handling
- Utilities to manage pending states

Routes and loaders are configured at runtime with `createBrowserRouter`.

```tsx
import { createBrowserRouter } from "react-router";

let router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        path: "shows/:showId",
        Component: Show,
        loader: ({ request, params }) =>
          fetch(`/api/show/${params.id}.json`, {
            signal: request.signal,
          }),
      },
    ],
  },
]);
```

The router is then rendered with `<RouterProvider>`:

```tsx
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
```

Using a data router, you now have access to nearly every runtime API in React Router.

## Framework

Building on top of the data mode, React Router can be used maximally as your React framework. In this setup, you'll use the React Router CLI and Vite bundler plugin for a full-stack development and deployment architecture. This enables React Router to provide a large set of features most web projects will want, including:

- Vite bundler and dev server integration
- hot module replacement
- code splitting
- route conventions with type safety
- file system or config-based routing
- data loading with type safety
- actions with type safety
- automatic revalidation of page data after actions
- SSR, SPA, and static rendering strategies
- APIs for pending states and optimistic UI
- deployment adapters

Routes are configured with `routes.ts` which enables React Router to do a lot for you. For example, it will automatically code-split each route, provide type safety for the parameters and data, and automatically load the data with access to pending states as the user navigates to it.

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
    route(":city/:id", "./concerts/show.tsx"),
    route("trending", "./concerts/trending.tsx"),
  ]),
] satisfies RouteConfig;
```

You'll have access to the Route Module API, which most of the other features are built on.

Loaders provide data to route components:

```tsx
// loaders provide data to components
export async function loader({ params }: Route.LoaderArgs) {
  const [show, isLiked] = await Promise.all([
    fakeDb.find("show", params.id),
    fakeIsLiked(params.city),
  ]);
  return { show, isLiked };
}
```

Components render at their configured URLs from routes.ts with the loader data passed in as a prop:

```tsx
export default function Show({
  loaderData,
}: Route.ComponentProps) {
  const { show, isLiked } = loaderData;
  return (
    <div>
      <h1>{show.name}</h1>
      <p>{show.description}</p>

      <form method="post">
        <button
          type="submit"
          name="liked"
          value={isLiked ? 0 : 1}
        >
          {isLiked ? "Remove" : "Save"}
        </button>
      </form>
    </div>
  );
}
```

Actions can update data and trigger a revalidation of all data on
the page so your UI stays up to date automatically:

```tsx
export async function action({
  request,
  params,
}: Route.LoaderArgs) {
  const formData = await request.formData();
  await fakeSetLikedShow(formData.get("liked"));
  return { ok: true };
}
```

Route modules also provide conventions for SEO, asset loading, error boundaries, and more.

[Get Started](./start/framework/installation) with React Router as a framework.

## Upgrading

If you are caught up on future flags, upgrading from React Router v6 or Remix is generally non-breaking:

- [Upgrade from v6](./upgrading/v6)
- [Upgrade from Remix](./upgrading/remix)
