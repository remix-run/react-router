#### Reduced Route Component Re-renders

In 8.4.0, we reworked our internal data router contexts to be more granular which will reduce re-renders for components using hooks to access only some router state. For example, your component won't automatically re-render when `navigation.state` transitions to `loading` if it only calls `useLocation`. 4 internal contexts are now used:

- Current location info (`useLocation`, `useSearchParams`, `useMatches`)
- Pending navigation/revalidation info (`useNavigation`, `useRevalidation`)
- Router loader/action data (`useLoaderData`, `useActionData`)
- Fetcher info (`useFetcher`, `useFetchers`)

#### More Efficient Route Matching (unstable)

Data Mode can now opt into a more efficient route matcher powered by `@remix-run/route-pattern`. Synthetic Chromium benchmarks reduced navigation and fetcher completion times by ~19–38% with 100 routes and ~71–88% with 1,000 routes, excluding network latency and React rendering.

Route definitions and path generation APIs such as `generatePath` and `href` continue to use React Router path syntax. Before enabling the flag, call `unstable_preloadRoutePattern()` so applications that do not opt in avoid downloading the new matcher.

This also comes with a new `unstable_validateParams` route field that accepts keyed regular expressions. When a parameter fails validation, matching continues to later routes. Optional parameters that are not present are not validated.

```ts
import { createBrowserRouter } from "react-router";
import { unstable_preloadRoutePattern } from "react-router/route-pattern";

unstable_preloadRoutePattern();

let router = createBrowserRouter(
  [
    {
      path: "/:drink",
      unstable_validateParams: {
        drink: /^(wines|whiskeys|sakes|beers)$/,
      },
    },
    {
      path: "/:food",
      unstable_validateParams: {
        food: /^(meats|veggies|cheeses|sweets)$/,
      },
    },
  ],
  {
    future: {
      unstable_routePatternMatching: true,
    },
  },
);
```

The legacy matching APIs (`matchRoutes`, `matchPath`, and `useMatch`) continue to use the previous regex-based matcher and may produce slightly different results. Use the new `router.match()` API when you need to match with the opted-in router. This API is private and unstable along with the flag, and will stabilize as the first-class matching API when the flag stabilizes.
