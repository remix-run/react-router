Add a Data Mode-only POC for route-pattern based route matching

- Adds `future.unstable_routePatternMatching: true` for Data Router matching only
- Uses `@remix-run/route-pattern` internally to match and rank route branches when the flag is enabled
- Keeps route definitions and public route/match fields in React Router path syntax
