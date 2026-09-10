Add a new Data Mode-only `future.unstable_routePatternMatching` flag to opt into more efficient `@remix-run/route-pattern` based route matching internally

- No code changes required - syntax remains the same for pubic route definitions and route match fields
- Once opting into this flag, you should no longer user legacy matching APIs (`matchRoutes`/`matchPath`/`useMatch`) as they are hardcoded to the previous regex-based matcher
  - A new `router.match()` API exists for those use cases but it's marked private and considered unstable along with the flag
- Path generation APIs such as `generatePath` and `href` continue to accept React Router path syntax
- This flag also comes with a new `unstable_validateParams` route field which uses keyed regular expressions so a route can reject matched params and let matching continue (non-matched optional params are not validated)

  ```ts
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
