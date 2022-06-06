# Router

The `@remix-run/router` package is the heart of [React Router](https://github.com/remix-run/react-router) and provides all the core functionality for routing, data loading, data mutations, and navigation.

If you're using React Router, you should never `import` anything directly from
the `@remix-run/router` or `react-router` packages, but you should have everything
you need in either `react-router-dom` or `react-router-native`. Both of those
packages re-export everything from `@remix-run/router` and `react-router`.

## API

A Router instance can be created using `createRouter`:

```js
// Create and initialize a router.  "initialize" contains all side effects
// including history listeners and kicking off the initial data fetch
let router = createRouter({
  // Routes array using react-router RouteObject's
  routes,
  // History instance
  history,
  // Optional hydration data for SSR apps
  hydrationData?: HydrationState;
}).initialize()
```

Internally, the Router represents the state in an object of the following format, which is available through `router.state`. You can also register a subscriber of the signature `(state: RouterState) => void` to execute when the state updates via `router.subscribe()`;

```ts
interface RouterState {
  // The `history` action of the most recently completed navigation
  historyAction: Action;
  // The current location of the router.  During a navigation this reflects
  // the "old" location and is updated upon completion of the navigation
  location: Location;
  // The current set of route matches
  matches: DataRouteMatch[];
  // False during the initial data load, true once we have our initial data
  initialized: boolean;
  // The state of the current navigation
  navigation: Navigation;
  // The state of an in-progress router.revalidate() calls
  revalidation: RevalidationState;
  // Scroll position to restore to for the active Location, false if we
  // should not restore,m or null if we don't have a saved position
  // Note: must be enabled via router.enableScrollRestoration()
  restoreScrollPosition: number | false | null;
  // Proxied `resetScroll` value passed to router.navigate() (default true)
  resetScrollPosition: boolean;
  // Data from the loaders for the current matches
  loaderData: RouteData;
  // Data from the action for the current matches
  actionData: RouteData | null;
  // Errors thrown from loaders/actions for the current matches
  errors: RouteData | null;
  // Map of all active fetchers
  fetchers: Map<string, Fetcher>;
}
```

### Navigations

All navigations are done through the `router.navigate` API which is overloaded to support different types of navigations:

```js
// Link navigation (pushes onto the history stack by default)
router.navigate("/page");

// Link navigation (replacing the history stack)
router.navigate("/page", { replace: true });

// Pop navigation (moving backward/forward in the history stack)
router.navigate(-1);

// Form submission navigation
let formData = new FormData();
formData.append(key, value);
router.navigate("/page", {
  formMethod: "post",
  formData,
});
```

### Fetchers

Fetchers are a mechanism to call loaders/actions without triggering a navigation, and are done through the `router.fetch()` API. All fetch calls require a unique key to identify the fetcher.

```js
// Execute the loader for /page
router.fetch("key", "/page");

// Submit to the action for /page
let formData = new FormData();
formData.append(key, value);
router.fetch("key", "/page", {
  formMethod: "post",
  formData,
});
```

## Revalidation

By default, active loaders will revalidate after any navigation or fetcher mutation. If you need to kick off a revalidation for other use-cases, you can use `router.revalidate()` to re-execute all active loaders.
