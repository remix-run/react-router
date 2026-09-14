Add a new Data Mode-only `future.unstable_routePatternMatching` flag to opt into more efficient route matching powered by `@remix-run/route-pattern`

- Synthetic Chromium benchmarks reduced navigation and fetcher completion times by ~19–38% with 100 routes and ~71–88% with 1,000 routes, excluding network latency and React rendering
- Await `unstable_preloadRoutePattern()` from `react-router/route-pattern` before enabling the flag. The matcher loads through a dynamic import, and router creation remains synchronous. For SSR, preload separately before creating the server's static handler and the browser's router.
- No route definition changes are required - syntax remains the same for public route definitions and route match fields
- Once opting into this flag, you should no longer use legacy matching APIs (`matchRoutes`/`matchPath`/`useMatch`) as they are hardcoded to the previous regex-based matcher
  - A new `router.match()` API exists for those use cases but it's marked private and considered unstable along with the flag
- Path generation APIs such as `generatePath` and `href` continue to accept React Router path syntax
- This flag also comes with a new `unstable_validateParams` route field which uses keyed regular expressions so a route can reject matched params and let matching continue (non-matched optional params are not validated)

  ```ts
  import { createBrowserRouter } from "react-router";
  import { unstable_preloadRoutePattern } from "react-router/route-pattern";

  await unstable_preloadRoutePattern();

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
