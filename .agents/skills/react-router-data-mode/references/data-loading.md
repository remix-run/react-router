---
title: Data Loading
description: Loading data with loaders and useLoaderData
tags: [loader, useLoaderData, data-loading, params, request]
---

# Data Loading

Data is loaded using `loader` functions defined on route objects. Loaders run before the component renders and their data is accessed via the `useLoaderData` hook.

## Basic Loader

```tsx
import { createBrowserRouter, useLoaderData } from "react-router";

const router = createBrowserRouter([
  {
    path: "/teams/:teamId",
    loader: async ({ params }) => {
      return fetchTeam(params.teamId);
    },
    Component: Team,
  },
]);

function Team() {
  const data = useLoaderData();
  return <h1>{data.name}</h1>;
}
```

## Loader Arguments

Loaders receive an object with:

- `params` - URL parameters from dynamic segments
- `request` - The Fetch Request object

```tsx
{
  path: "/products/:productId",
  loader: async ({ params, request }) => {
    // Access route params
    const productId = params.productId;

    // Access search params from request
    const url = new URL(request.url);
    const sort = url.searchParams.get("sort");

    return fetchProduct(productId, { sort });
  },
  Component: Product,
}
```

### Using Request for Search Params

```tsx
{
  path: "/search",
  loader: async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";
    const page = Number(url.searchParams.get("page")) || 1;

    return search(query, { page });
  },
  Component: SearchResults,
}
```

### Using Request Signal for Cancellation

```tsx
{
  path: "/search",
  loader: async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    // Pass signal to abort request if user navigates away
    const results = await fetch(`/api/search?q=${query}`, {
      signal: request.signal,
    });

    return results.json();
  },
  Component: SearchResults,
}
```

## Returning Data

Loaders can return any serializable data:

```tsx
// Return object
loader: async () => {
  return { users: await fetchUsers() };
}

// Return array
loader: async () => {
  return fetchProducts();
}

// Return Response object
loader: async () => {
  const data = await fetchData();
  return Response.json(data, {
    headers: { "Cache-Control": "max-age=3600" },
  });
}
```

## Throwing Errors

Throw responses to trigger error boundaries:

```tsx
{
  path: "/teams/:teamId",
  loader: async ({ params }) => {
    const team = await fetchTeam(params.teamId);

    if (!team) {
      throw new Response("Not Found", { status: 404 });
    }

    return team;
  },
  ErrorBoundary: TeamError,
  Component: Team,
}
```

## Throwing Redirects

Redirect from loaders using the `redirect` function:

```tsx
import { redirect } from "react-router";

{
  path: "/dashboard",
  loader: async ({ request }) => {
    const user = await getUser(request);

    if (!user) {
      throw redirect("/login");
    }

    return user;
  },
  Component: Dashboard,
}
```

### Redirect with Search Params

```tsx
loader: async ({ request }) => {
  const user = await getUser(request);

  if (!user) {
    const url = new URL(request.url);
    throw redirect(`/login?returnTo=${encodeURIComponent(url.pathname)}`);
  }

  return user;
}
```

## Parallel Data Loading

React Router loads data for all matched routes in parallel. Parent and child loaders run simultaneously:

```tsx
const router = createBrowserRouter([
  {
    path: "/",
    loader: rootLoader, // Runs in parallel with child loaders
    Component: Root,
    children: [
      {
        path: "teams/:teamId",
        loader: teamLoader, // Runs in parallel with root loader
        Component: Team,
        children: [
          {
            path: "members",
            loader: membersLoader, // All three run in parallel
            Component: Members,
          },
        ],
      },
    ],
  },
]);
```

This eliminates waterfall requests common with `useEffect` data fetching.

## Revalidation

After actions complete, all loaders on the page automatically revalidate to keep data fresh. Control this with `shouldRevalidate`:

```tsx
{
  path: "/products",
  loader: productsLoader,
  shouldRevalidate: ({ currentUrl, nextUrl, defaultShouldRevalidate }) => {
    // Skip revalidation for query-only changes
    if (currentUrl.pathname === nextUrl.pathname) {
      return false;
    }
    return defaultShouldRevalidate;
  },
  Component: Products,
}
```

## Multiple Loaders in Nested Routes

Each route can have its own loader. Access parent data with `useRouteLoaderData`:

```tsx
import { useRouteLoaderData } from "react-router";

const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    loader: async () => {
      return { user: await getCurrentUser() };
    },
    Component: Root,
    children: [
      {
        path: "dashboard",
        loader: async () => {
          return { stats: await getDashboardStats() };
        },
        Component: Dashboard,
      },
    ],
  },
]);

function Dashboard() {
  const dashboardData = useLoaderData(); // { stats: ... }
  const rootData = useRouteLoaderData("root"); // { user: ... }

  return (
    <div>
      <h1>Welcome, {rootData.user.name}</h1>
      <Stats data={dashboardData.stats} />
    </div>
  );
}
```

## Complete Example

```tsx
import {
  createBrowserRouter,
  RouterProvider,
  useLoaderData,
  useParams,
  redirect,
} from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    loader: async () => {
      return { user: await getCurrentUser() };
    },
    Component: Root,
    children: [
      { index: true, Component: Home },
      {
        path: "teams/:teamId",
        loader: async ({ params, request }) => {
          const user = await getUser(request);
          if (!user) {
            throw redirect("/login");
          }

          const team = await fetchTeam(params.teamId);
          if (!team) {
            throw new Response("Not Found", { status: 404 });
          }

          return { team };
        },
        Component: Team,
      },
    ],
  },
]);

function Team() {
  const { team } = useLoaderData();
  const { teamId } = useParams();

  return (
    <div>
      <h1>{team.name}</h1>
      <p>Team ID: {teamId}</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
```

## See Also

- [route-object.md](./route-object.md) - All route object properties
- [actions.md](./actions.md) - Form handling and mutations
- [React Router Loaders Documentation](https://reactrouter.com/start/data/data-loading)
