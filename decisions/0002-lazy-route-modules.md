# Lazy Route Modules

Date: 2023-02-21

Status: accepted

## Context

In a data-aware React Router application (`<RouterProvider>`), the router needs to be aware of the route tree ahead of time so it can match routes and execute loaders/actions _prior_ to rendering the destination route. This is different than in non-data-aware React Router applications (`<BrowserRouter>`) where you could nest `<Routes>` sub-tree anywhere in your application, and compose together `<React.Suspense>` and `React.lazy()` to dynamically load "new" portions of your routing tree as the user navigated through the application. The downside of this approach in `BrowserRouter` is that it's a render-then-fetch cycle which produces network waterfalls and nested spinners, two things that we're aiming to eliminate in `RouterProvider` applications.

There were ways to [manually code-split][manually-code-split] in a `RouterProvider` application but they can be a bit verbose and tedious to do manually. As a result of this DX, we received a [Remix Route Modules Proposal][proposal] from community along with a [POC implementation][poc] (thanks `@rossipedia` 🙌).

## Original POC

The original POC idea was to implement this in user-land where `element`/`errorElement` would be transformed into `React.Lazy()` calls and `loader`/`action` would load the module and then execute the `loader`/`action`:

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

This proved to work out quite well as we id our own POC so we went with this approach in the end. Now, any time we enter a `submitting`/`loading` state we first check for a `route.lazy` definition and resolve that promise first and update the internal route definition with the result.

- If an error is thrown by `lazy()` we catch that in the same logic as iof the error was thrown by the action/loader and bubble it to the nearest `errorElement`
- If a `lazy` call is interrupted, we fall into the same interruption handling that actions and loaders already use
- We also restrict which route keys can be updated, preventing users from changing route-matching fields such as `path`/`index`/`children` as those must be defined up front and are considered immutable

Initially we considered doing an automatic Remix-style-exports mapping so you could export an `ErrorBoundary` from your route file and we'd transform that to `errorElement`, but we chose to avoid that since it's (1) Remix specific and introduces more non-framework-agnostic concepts since `errorElement` isn't actually a field known to the `@remix-run/router` layer. Instead we chose to keep lazy to known route properties and folks are free to define their own mappings in user-land:

```jsx
function remixStyleExports(loadModule) {
  let { loader, default as Component, ErrorBoundary } = await loadModule();
  return {
    loader,
    element: <Component />,
    errorElement: <ErrorBoundary />,
  };
}

const routes = [{
  path: '/',
  lazy: () => remixStyleExports(() => import("./route")),
}]
```

## Consequences

Not so much as a consequence, but more of limitation - we still require the routing tree up front-for the most efficient data-loading. This means that we can't _yet_ support quite the same nested `<Routes>` use-cases as before (particularly with respect to microfrontends), but we have ideas for how to solve tht as an extension of this concept in the future.

Another slightly edge-case concept we discovered is that in DIY SSR applications using `createStaticHandler` and `StaticRouterProvider`, it's possible to server-render a lazy route and send up it's hydration data. But then we may _not_ have those routes loaded in our client-side hydration:

```jsx
const routes = [{
  path: '/',
  lazy: () => import("./route"),
}]
let router = createBrowserRouter(routes, {
  hydrationData: window.__hydrationData,
});

// ⚠️ What if we're not initialized here!

ReactDOM.hydrateRoot(
  document.getElementById("app")!,
  <RouterProvider router={router} fallbackElement={null} />
);
```

In the above example, we've server-rendered our `/` route and therefore we _don't_ want to render a `fallbackElement` since we already have the SSR'd content, and the router doesn't need to "initialize" because we've provided the data in `hydrationData`. However, if we're hydrating into a route that includes `lazy`, then we _do_ need to initialize that lazy route.

The real solution for this is to do what Remix does and know your matched routes and preload their modules ahead of time and hydrate with synchronous route definitions. This is a non-trivial process through so it's not expected that every DIY SSR use-case will handle it. Instead, the router will not be initialized until any initially matched lazy routes are loaded, and therefore we need to delay the hydration or our `RouterProvider`:

```jsx
if (!router.state.initialized) {
  let unsub = router.subscribe((state) => {
    if (state.initialized) {
      unsub();
      hydrate();
    }
  });
} else {
  hydrate();
}
```

At the moment this is implemented in a new `ready()` API that we're still deciding if we'll keep or not:

```js
let router = await createBrowserRouter(routes).ready();
```

[manually-code-split]: https://www.infoxicator.com/en/react-router-6-4-code-splitting
[proposal]: https://github.com/remix-run/react-router/discussions/9826
[poc]: https://github.com/remix-run/react-router/pull/9830
