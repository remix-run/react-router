---
title: Migrating to RouterProvider
order: 1
---

# Migrating to RouterProvider

When we originally began bringing the [Remix Data APIs over to React Router][remixing-react-router] we realized that they brought about a pretty different way of structuring your routes. Instead of discovering routes via the [`<Routes>`][routes-component] component _as React rendered the component tree_, we needed to _lift_ the route definitions so we could [decouple fetching from rendering][when-to-fetch].

This brought about an interesting conundrum. We've got tons of v6 [`BrowserRouter`][browserrouter] apps out there happily defining their routes via `<Routes>` components -- how can we provide them with a smooth upgrade experience that doesn't require a big-bang migration to the new approach? This ruled out a new major version and we focused on adding these new features in a _fully backwards compatible_ way that would provide users an _incremental_ upgrade path from [`BrowserRouter`][browserrouter] to [`RouterProvider`][routerprovider].

## Differences

The first thing to be aware of is the presence of a handful of new [Data APIs][data-apis] that only work on routes _defined_ via the new [data routers][picking-a-router] (i.e., [`createBrowserRouter`][createbrowserrouter]). These include a few categories of APIs:

- Route-level data APIs such as `loader`, `action`, `shouldRevalidate`, `handle`, and `lazy`
- In-component data hooks such as `useLoaderData`, `useActionData`, `useFetcher`, `useMatches`, `useNavigation`, etc.
- Error-handling APIs such as `route.errorElement`, `route.ErrorBoundary`, and `useRouteError`

The rest of the APIs that existed prior to v6.4.0 are still usable in _both_ `BrowserRouter` and `RouterProvider` apps. These include common hooks/components such as `useNavigate`, `useLocation`, `useParams`, `<Link>`, `<Outlet />`, etc.

## Migrating

We built the new `<RouterProvider>` component such that it would enable the new Data APIs on routes defined at the root router, while not excluding descendant `<Routes>` trees so commonly used in `BrowserRouter` apps. This was explicitly to allow incremental migration from one to the other. Let's take a look at how we would do this.

### Current Application

Let's assume we've got a current application with 2 descendant route trees, and assume these routes are all doing in-component data fetching, and rendering their own loading and error states.

```tsx
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
} from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog/*" element={<BlogApp />} />
        <Route path="/users/*" element={<UserApp />} />
      </Routes>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <>
      <h1>Welcome!</h1>
      <p>
        Check out the <Link to="/blog">blog</Link> or the{" "}
        <Link to="users">users</Link> section
      </p>
    </>
  );
}

function BlogApp() {
  return (
    <Routes>
      <Route index element={<h1>Blog Index</h1>} />
      <Route path="posts" element={<h1>Blog Posts</h1>} />
    </Routes>
  );
}

function UserApp() {
  return (
    <Routes>
      <Route index element={<h1>Users Index</h1>} />
    </Routes>
  );
}
```

### Add RouterProvider with a root splat route

We can render this application inside a `RouterProvider` with only a few small changes:

1. Change your current `App` component to `Root`
2. Remove the `<BrowserRouter>` component
3. Create a data router singleton with a splat route for the `Root` element
4. Add a new `App` component rendering a `<RouterProvider>`

```tsx lines=[9-12,14-17,19-20,21-22]
import {
  createBrowserRouter,
  Link,
  Route,
  RouterProvider,
  Routes,
} from "react-router-dom";

// 3️⃣ Router singleton created
const router = createBrowserRouter([
  { path: "*", element: <Root /> },
]);

// 4️⃣ RouterProvider added
export default function App() {
  return <RouterProvider router={router} />;
}

// 1️⃣ Changed from App to Root
function Root() {
  // 2️⃣ `BrowserRouter` component removed, but the <Routes>/<Route>
  // component below are unchanged
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/blog/*" element={<BlogApp />} />
      <Route path="/users/*" element={<UserApp />} />
    </Routes>
  );
}

function Home() {
  /* Unchanged */
}
function BlogApp() {
  /* Unchanged */
}
function UserApp() {
  /* Unchanged */
}
```

🥳 Congrats - you're now rendering a data router app! But wait a minute - we can't use any of the new stuff yet since none of our routes are defined at the top with `createBrowserRouter` 😢. To access the new APIs, we need to start lifting routes one-by-one to the data router.

### Start lifting routes and leveraging the data APIs

Let's start with the `/` route for the `<Home>` element. All we need to do is lift the `<Route>` definition up to the data router:

```tsx lines=[2,13]
const router = createBrowserRouter([
  { path: "/", element: <Home /> }, // 🆕
  { path: "*", element: <Root /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}

function Root() {
  return (
    <Routes>
      {/* ⬆️ Home route lifted up to the data router */}
      <Route path="/blog/*" element={<BlogApp />} />
      <Route path="/users/*" element={<UserApp />} />
    </Routes>
  );
}
```

Now you can add data APIs to your home route (`loader`, `action`, `errorElement`) and start leveraging data hooks inside your Home component (`useLoaderData`, `useActionData`, `useFetcher`, `<Form>`, etc.).

Now let's look at lifting the Blog App upwards, but still doing it one leaf route at a time. In order to lift the `/blog` index route up, we need the `/blog/*` splat route lifted as well, but we can still render the `/blog/posts` route where it is and do that separately.

```tsx lines=[3-12,23,32]
const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  {
    // Lifted blog splat route
    path: "/blog/*",
    children: [
      // New blog index route
      { index: true, element: <h1>Blog Index</h1> },
      // Blog subapp splat route added for /blog/posts matching
      { path: "*", element: <BlogApp /> },
    ],
  },
  { path: "*", element: <Root /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}

function Root() {
  return (
    <Routes>
      {/* ⬆️ Blog splat route lifted */}
      <Route path="/users/*" element={<UserApp />} />
    </Routes>
  );
}

function BlogApp() {
  return (
    <Routes>
      {/* ⬆️ Blog index route lifted */}
      <Route path="posts" element={<h1>Blog Posts</h1>} />
    </Routes>
  );
}
```

And now your blog index route can participate in data loading.

You can keep doing this one route at a time until you've eventually converted all of your routes to data routes and can no longer use any nested `<Routes>` to define your routing tree. To avoid bundle bloat, it's recommended to leverage the [route.lazy][route-lazy] prop to lazily load your routes.

## FAQ

### But I've got stuff between `<BrowserRouter>` and `<Routes>`

Many folks render an app shell around their `<Routes>` via something like the following:

```jsx
export default function App() {
  return (
    <BrowserRouter>
      <header>
        <h1>My Super Cool App</h1>
        <NavMenu />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog/*" element={<BlogApp />} />
          <Route path="/users/*" element={<UserApp />} />
        </Routes>
      </main>
      <footer>©️ me 2023</footer>
    </BrowserRouter>
  );
}
```

If you find yourself in this situation, don't worry - there's a straightforward solution you can do _before_ starting the above migration.

This is quite common but poses a problem in the above migration approach since we need to lift things to `RouterProvider` route-by-route, but this "app shell" stuff isn't part of a route...but it could be! That "app shell" is really nothing more than a layout route with an `<Outlet>`! So before starting the above migration, just move this "app shell" into a pathless layout route around your routes as follows:

```jsx lines=[6,25]
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1️⃣ Wrap your routes in a pathless layout route */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/blog/*" element={<BlogApp />} />
          <Route path="/users/*" element={<UserApp />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Layout() {
  return (
    <>
      <header>
        <h1>My Super Cool App</h1>
        <NavMenu />
      </header>
      <main>
        {/* 2️⃣ Render the app routes via the Layout Outlet */}
        <Outlet />
      </main>
      <footer>©️ me 2023</footer>
    </>
  );
}
```

Once you've done that, you can proceed with the above migration strategy and start lifting routes into your `RouterProvider` one-by-one. You'll likely want to lift the layout route first so all of the children can nest inside of it.

[remixing-react-router]: https://remix.run/blog/remixing-react-router
[when-to-fetch]: https://www.youtube.com/watch?v=95B8mnhzoCM
[picking-a-router]: ../routers/picking-a-router
[data-apis]: ../routers/picking-a-router#data-apis
[createbrowserrouter]: ../routers/create-browser-router
[routerprovider]: ../routers/router-provider
[browserrouter]: ../router-components/browser-router
[routes-component]: ../components/routes
[route-lazy]: ../route/lazy
