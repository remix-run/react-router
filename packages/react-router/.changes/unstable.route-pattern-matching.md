Add a Data Mode-only POC for route-pattern based route matching

- Adds `future.unstable_routePatternMatching: true` for Data Router matching only
- Uses `@remix-run/route-pattern` internally to match and rank route branches when the flag is enabled
- Keeps route definitions and public route/match fields in React Router path syntax
- Manual matching APIs such as `matchRoutes`, `matchPath`, and `useMatch` continue to use legacy path matching and should not be used once a Data Router opts into `future.unstable_routePatternMatching` because they may not return the same matches as the router
- Path generation APIs such as `generatePath` and `href` continue to accept React Router path syntax
- Adds an `unstable_validateParams` POC using keyed regular expressions so a route can reject matched params and let matching continue. Params omitted from a match, such as optional params, are not validated.

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
