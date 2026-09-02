Add a new Data Mode-only `future.unstable_routePatternMatching` flag to opt into more efficient `@remix-run/route-pattern` based route matching internally

- Import the matcher from `react-router/route-pattern` so applications that do not enable the flag do not include `@remix-run/route-pattern` in their bundles
- No route definition changes are required - syntax remains the same for public route definitions and route match fields
- Once opting into this flag, you should no longer use legacy matching APIs (`matchRoutes`/`matchPath`/`useMatch`) as they are hardcoded to the previous regex-based matcher
  - A new `router.match()` API exists for those use cases but it's marked private and considered unstable along with the flag
- Path generation APIs such as `generatePath` and `href` continue to accept React Router path syntax
- This flag also comes with a new `unstable_validateParams` route field which uses keyed regular expressions so a route can reject matched params and let matching continue (non-matched optional params are not validated)

  ```ts
  import { unstable_routePatternMatching } from "react-router/route-pattern";

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
        unstable_routePatternMatching,
      },
    },
  );
  ```
