# Data Mode

Data Mode uses data routers such as `createBrowserRouter` and renders with `<RouterProvider>`. It gives an app route objects, loaders, actions, pending UI, fetchers, and SSR primitives without adopting the Framework Vite plugin or route-module file conventions.

Use this reference after the main skill identifies a Data Mode app.

## Read the Local Docs by Mode

Start with:

```txt
react-router/docs/start/modes.md
react-router/docs/start/data/index.md
```

Then use the Data docs under:

```txt
react-router/docs/start/data/
```

Those files cover installation, route objects, routing, data loading, actions, navigation, pending UI, and testing. For task-specific details, read relevant files in:

```txt
react-router/docs/how-to/
react-router/docs/explanation/
```

Always check the `[MODES: data, ...]` marker in a doc before applying it.

## Data Router Shape

Typical setup:

```tsx
import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    loader: rootLoader,
    children: [
      { index: true, Component: Home },
      {
        path: "projects/:projectId",
        Component: Project,
        loader: projectLoader,
      },
    ],
  },
]);

root.render(<RouterProvider router={router} />);
```

Look for route object arrays and APIs such as:

- `createBrowserRouter`
- `createHashRouter`
- `createMemoryRouter`
- `RouterProvider`
- `loader`
- `action`
- `Component`
- `ErrorBoundary`
- `lazy`
- `children`

## Route Objects and Routing

Before editing route configuration, read:

```txt
react-router/docs/start/data/routing.md
react-router/docs/start/data/route-object.md
```

Rules:

- Keep route objects outside render when possible.
- Use nested routes for shared layouts and data boundaries.
- Use index routes for default child content.
- Use dynamic segments and splats according to route-object docs.
- Prefer `Component`/`ErrorBoundary` route object properties in Data Mode examples unless the existing app uses `element` consistently.

## Data and Mutations

Before working on data loading or mutations, read:

```txt
react-router/docs/start/data/data-loading.md
react-router/docs/start/data/actions.md
```

Rules:

- Load route data with route `loader` functions.
- Mutate route data with route `action` functions.
- Prefer loaders/actions over route-level `useEffect` fetching.
- Use `request`, `params`, and returned/throwable Responses as described in the docs.
- Let React Router revalidate after actions unless there is a documented reason to customize revalidation.

Common patterns:

- Validation failure from an action: return `data({ errors, values }, { status: 400 })`, then render errors with `useActionData()` or `fetcher.data`.
- Missing record in a loader: throw `data("Not Found", { status: 404 })` and render the route `ErrorBoundary`.
- Search/filter data: parse `new URL(request.url).searchParams` in the loader so the URL is shareable and bookmarkable.

## Forms, Fetchers, and Pending UI

For forms and pending UI, read:

```txt
react-router/docs/start/data/actions.md
react-router/docs/start/data/pending-ui.md
react-router/docs/how-to/fetchers.md
react-router/docs/explanation/form-vs-fetcher.md
```

Rules of thumb:

- Search/filter form that updates the URL: `<Form method="get">`.
- Mutation that should change URL/history or redirect after completion: `<Form method="post">`.
- Mutation that should keep the user on the same page: `useFetcher` / `<fetcher.Form>`.
- Optimistic UI: derive from `fetcher.formData` or `navigation.formData`.

## Navigation and URL State

Before changing navigation or search params, read:

```txt
react-router/docs/start/data/navigating.md
react-router/docs/how-to/search-params.md
react-router/docs/explanation/location.md
```

Rules:

- Use `<Link>`/`<NavLink>` for user-initiated internal navigation.
- Use `redirect` in loaders/actions when navigation follows data loading or mutations.
- Use `useNavigate` for imperative client-side event navigation.
- Treat URL params as strings and validate/parse them.
- Preserve unrelated search params unless intentionally resetting them.

## SSR in Data Mode

Data Mode SSR is manual and lower-level than Framework Mode. Before implementing or changing SSR, read the Data Mode custom/SSR docs and match existing server abstractions.

Start with:

```txt
react-router/docs/start/data/custom.md
```

Look for APIs like `createStaticHandler`, `createStaticRouter`, `StaticRouterProvider`, and hydration data handling in the current app before changing anything.

## RSC Data

If this Data Mode app uses `unstable_RSCRouteConfig`, RSC route config, or low-level RSC server APIs, also read:

```txt
references/rsc.md
react-router/docs/how-to/react-server-components.md
```
