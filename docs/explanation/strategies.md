---
title: Routing Strategies
order: 1
---

# React Router Strategies

React Router is a multi-strategy router for React. You can use it maximally as a React framework or minimally as a library with your own frontend tooling.

## React Router as a Library

Like previous versions, React Router can still be used as a simple, declarative routing library. Its only job will be matching the URL to a set of components, providing access to URL data, and navigating around the app.

This strategy is great for apps that have their own frontend infrastructure. It's particularly good at local first and offline + sync architectures where pending states are rare (since reads and writes are local in the browser) and users have long running sessions (code splitting, SEO, and initial page load times can be traded out for instant interactions).

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

[Get Started](../library/installation) with React Router as a library.

## React Router as a framework

React Router can be used maximally as your React framework. In this setup, you'll use the React Router CLI and Vite bundler plugin for a full-stack development and deployment architecture. This enables React Router to provide a large set of features most web projects will want, including:

- bundler plugin
- integrated dev server with HMR
- code splitting
- route conventions with type safety
- file system or config-based routing
- data loading with type safety
- actions with type safety
- automatic revalidation of page data after actions
- SSR, SPA, and static rendering strategies
- APIs for pending states and optimistic UI

Routes are configured with `routes.ts` which enables React Router to do a lot for you. For example, it will automatically code-split each route, provide type safety for the parameters and data, and automatically load the data with pending states as the user navigates to it.

```ts
import {
  type RouteConfig,
  route,
  index,
  layout,
  prefix,
} from "@react-router/dev/routes";

export const routes: RouteConfig = [
  index("./home.tsx"),
  route("about", "./about.tsx"),

  layout("./auth/layout.tsx", [
    route("login", "./auth/login.tsx"),
    route("register", "./auth/register.tsx"),
  ]),

  ...prefix("concerts", [
    index("./concerts/home.tsx"),
    route(":city", "./concerts/city.tsx"),
    route(":city/:id", "./concerts/show.tsx")
    route("trending", "./concerts/trending.tsx"),
  ]),
];
```

You'll have access to the Route Module API, which most of the other features are built on.

```tsx
// loaders provide data to components
export async function loader({ params }: Route.LoaderArgs) {
  const [show, isLiked] = await Promise.all([
    fakeDb.find("show", params.id),
    fakeIsLiked(params.city),
  ]);
  return { show, isLiked };
}

// components render at their configured URLs from routes.ts
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

// actions can update data and automatically cause revalidation of all data on
// the page so your UI stays up to date
export async function action({
  request,
  params,
}: Route.LoaderArgs) {
  const formData = await request.formData();
  await fakeSetLikedShow(formData.get("liked"));
  return { ok: true };
}
```

[Get Started](../framework/start/installation) with React Router as a framework.
