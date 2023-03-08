# Lazy Route Modules

Date: 2023-02-21

Status: accepted

## Context

In a data-aware React Router application (`<RouterProvider>`), the router needs to be aware of the route tree ahead of time so it can match routes and execute loaders/actions _prior_ to rendering the destination route. This is different than in non-data-aware React Router applications (`<BrowserRouter>`) where you could nest `<Routes>` sub-tree anywhere in your application, and compose together `<React.Suspense>` and `React.lazy()` to dynamically load "new" portions of your routing tree as the user navigated through the application. The downside of this approach in `BrowserRouter` is that it's a render-then-fetch cycle which produces network waterfalls and nested spinners, two things that we're aiming to eliminate in `RouterProvider` applications.

There were ways to [manually code-split][manually-code-split] in a `RouterProvider` application but they can be a bit verbose and tedious to do manually. As a result of this DX, we received a [Remix Route Modules Proposal][proposal] from the community along with a [POC implementation][poc] (thanks `@rossipedia` 🙌).

## Original POC

The original POC idea was to implement this in user-land where `element`/`errorElement` would be transformed into `React.lazy()` calls and `loader`/`action` would load the module and then execute the `loader`/`action`:

```js
// Assuming route.module is a function returning a Remix-style route module
let Component = React.lazy(route.module);
route.element = <Component />;
route.loader = async (args) => {
  const { loader } = await route.module();
  return typeof loader === "function" ? loader(args) : null;
};
```

This approach got us pretty far but suffered from some limitations being done in user-land since it did not have access to some router internals to make for a more seamless integration. Namely, it _had_ to put every possible property onto a route since it couldn't know ahead of time whether the route module would resolve with the matching property. For example, will `import('./route')` return an `errorElement`? Who knows!

To combat this, a `route.use` property was considered which would allow the user to define the exports of the module:

```js
const route = {
  path: "/",
  module: () => import("./route"),
  use: ["loader", "element"],
};
```

This wasn't ideal since it introduced a tight coupling of the file contents and the route definitions.

Furthermore, since the goal of `RouterProvider` is to reduce spinners, it felt incorrect to automatically introduce `React.lazy` and thus expect Suspense boundaries for elements that we expected to be fully fetched _prior_ to rendering the destination route.

## Decision

Given what we learned from the original POC, we felt we could do this a bit leaner with an implementation inside the router. Data router apps already have an asynchronous pre-render flow where we could hook in and run this logic. A few advantages of doing this inside of the router include:

- We can load at a more specific spot internal to the router
- We can access the navigation `AbortSignal` in case the `lazy()` call gets interrupted
- We can also load once and update the internal route definition so subsequent navigations don't have a repeated `lazy()` call
- We don't have issue with knowing whether or not an `errorElement` exists since we will have updated the route prior to updating any UI state

This proved to work out quite well as we did our own POC so we went with this approach in the end. Now, any time we enter a `submitting`/`loading` state we first check for a `route.lazy` definition and resolve that promise first and update the internal route definition with the result.

The resulting API looks like this, assuming you want to load your homepage in the main bundle, but lazily load the code for the `/about` route. Note we're using the new `Component` API introduced along with this work.

```jsx
// app.jsx
const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: "about",
        lazy: () => import("./about"),
      },
    ],
  },
]);
```

And then your `about.jsx` file would export the properties to be lazily defined on the route:

```jsx
// about.jsx
export function loader() { ... }

export function Component() { ... }
```

## Choices

Here's a few choices we made along the way:

### Immutable Route Properties

A route has 3 types of fields defined on it:

- Path matching properties: `path`, `index`, `caseSensitive` and `children`
  - While not strictly used for matching, `id` is also considered static since it is needed up-front to uniquely identify all defined routes
- Data loading properties: `loader`, `action`, `hasErrorBoundary`, `shouldRevalidate`
- Rendering properties: `handle` and the framework-aware `element`/`errorElement`/`Component`/`ErrorBoundary`

The `route.lazy()` method is focused on lazy-loading the data loading and rendering properties, but cannot update the path matching properties because we have to path match _first_ before we can even identify which matched routes include a `lazy()` function. Therefore, we do not allow path matching route keys to be updated by `lazy()`, and will log a warning if you return one of those properties from your lazy() method.

## Static Route Properties

Similar to how you cannot override any immutable path-matching properties, you also cannot override any statically defined data-loading or rendering properties (and will log the a console warning if you attempt to). This allows you to statically define aspects that you don't need (or wish) to lazy load. Two potential use-cases her might be:

1. Using a small statically-defined `loader`/`action` which just hits an API endpoint to load/submit data.
   - In fact this is an interesting option we've optimized React Router to detect this and call any statically defined loader/action handlers in parallel with `lazy` (since `lazy` will be unable to update the `loader`/`action` anyway!). This will provide the ability to obtain the most-optimal parallelization of loading your component in parallel with your data fetches.
2. Re-using a common statically-defined `ErrorBoundary` across multiple routes

### Addition of route `Component` and `ErrorBoundary` fields

In React Router v6, routes define `element` properties because it allows static prop passing as well as fitting nicely in the JSX render-tree-defined route trees:

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Homepage prop="value" />} />
  </Routes>
</BrowserRouter>
```

However, in a React Router 6.4+ landscape when using `RouterProvider`, routes are defined statically up-front to enable data-loading, so using element feels arguably a bit awkward outside of a JSX tree:

```js
const routes = [
  {
    path: "/",
    element: <Homepage prop="value" />,
  },
];
```

It also means that you cannot easily use hooks inline, and have to add a level of indirection to access hooks.

This gets a bit more awkward with the introduction of `lazy()` since your file now has to export a root-level JSX element:

```jsx
// home.jsx
export const element = <Homepage />

function Homepage() { ... }
```

In reality, what we want in this "static route definition" landscape is just the component for the Route:

```js
const routes = [
  {
    path: "/",
    Component: Homepage,
  },
];
```

This has a number of advantages in that we can now use inline component functions to access hooks, provide props, etc. And we also simplify the exports of a `lazy()` route module:

```jsx
const routes = [
  {
    path: "/",
    // You can include just the component
    Component: Homepage,
  },
  {
    path: "/a",
    // Or you can inline your component and pass props
    Component: () => <Homepage prop="value" />,
  },
  {
    path: "/b",
    // And even use use hooks without indirection 💥
    Component: () => {
      let data = useLoaderData();
      return <Homepage data={data} />;
    },
  },
];
```

So in the end, the work for `lazy()` introduced support for `route.Component` and `route.ErrorBoundary`, which can be statically or lazily defined. They will take precedence over `element`/`errorElement` if both happen to be defined, but for now both are acceptable ways to define routes. We think we'll be expanding the `Component` API in the future for stronger type-safety since we can pass it inferred-type `loaderData` etc. so in the future that _may_ become the preferred API.

### Interruptions

Previously when a link was clicked or a form was submitted, since we had the `action`/`loader` defined statically up-front, they were immediately executed and there was no chance for an interruption _before calling the handler_. Now that we've introduced the concept of `lazy()` there is a period of time prior to executing the handler where the user could interrupt the navigation by clicking to a new location. In order to keep behavior consistent with lazily-loaded routes and statically defined routes, if a `lazy()` function is interrupted React Router _will still call the returned handler_. As always, the user can leverage `request.signal.aborted` inside the handler to short-circuit on interruption if desired.

This is important because `lazy()` is only ever run once in an application session. Once lazy has completed it updates the route in place, and all subsequent navigations to that route use the now-statically-defined properties. Without this behavior, routes would behave differently on the _first_ navigation versus _subsequent_ navigations which could introduce subtle and hard-to-track-down bugs.

Additionally, since `lazy()` functions are intended to return a static definition of route `loader`/`element`/etc. - if multiple navigations happen to the same route in parallel, the first `lazy()` call to resolve will "win" and update the route, and the returned values from any other `lazy()` executions will be ignored. This should not be much of an issue in practice though as modern bundlers latch onto the same promise for repeated calls to `import()` so in those cases the first call will still "win".

### Error Handling

If an error is thrown by `lazy()` we catch that in the same logic as if the error was thrown by the `action`/`loader` and bubble it to the nearest `errorElement`.

## Consequences

Not so much as a consequence, but more of limitation - we still require the routing tree up-front for the most efficient data-loading. This means that we can't _yet_ support quite the same nested `<Routes>` use-cases as before (particularly with respect to microfrontends), but we have ideas for how to solve that as an extension of this concept in the future.

Another slightly edge-case concept we discovered is that in DIY SSR applications using `createStaticHandler` and `StaticRouterProvider`, it's possible to server-render a lazy route and send up its hydration data. But then we may _not_ have those routes loaded in our client-side hydration:

```jsx
const routes = [{
  path: '/',
  lazy: () => import("./route"),
}]
let router = createBrowserRouter(routes, {
  hydrationData: window.__hydrationData,
});

// ⚠️ At this point, the router has the data but not the route definition!

ReactDOM.hydrateRoot(
  document.getElementById("app")!,
  <RouterProvider router={router} fallbackElement={null} />
);
```

In the above example, we've server-rendered our `/` route and therefore we _don't_ want to render a `fallbackElement` since we already have the SSR'd content, and the router doesn't need to "initialize" because we've provided the data in `hydrationData`. However, if we're hydrating into a route that includes `lazy`, then we _do_ need to initialize that lazy route.

The real solution for this is to do what Remix does and know your matched routes and preload their modules ahead of time and hydrate with synchronous route definitions. This is a non-trivial process through so it's not expected that every DIY SSR use-case will handle it. Instead, the router will not be initialized until any initially matched lazy routes are loaded, and therefore we need to delay the hydration or our `RouterProvider`.

The recommended way to do this is to manually match routes against the initial location and load/update any lazy routes before creating your router:

```jsx
// Determine if any of the initial routes are lazy
let lazyMatches = matchRoutes(routes, window.location)?.filter(
  (m) => m.route.lazy
);

// Load the lazy matches and update the routes before creating your router
// so we can hydrate the SSR-rendered content synchronously
if (lazyMatches && lazyMatches.length > 0) {
  await Promise.all(
    lazyMatches.map(async (m) => {
      let routeModule = await m.route.lazy!();
      Object.assign(m.route, { ...routeModule, lazy: undefined });
    })
  );
}

// Create router and hydrate
let router = createBrowserRouter(routes)
ReactDOM.hydrateRoot(
  document.getElementById("app")!,
  <RouterProvider router={router} fallbackElement={null} />
);
```

[manually-code-split]: https://www.infoxicator.com/en/react-router-6-4-code-splitting
[proposal]: https://github.com/remix-run/react-router/discussions/9826
[poc]: https://github.com/remix-run/react-router/pull/9830
