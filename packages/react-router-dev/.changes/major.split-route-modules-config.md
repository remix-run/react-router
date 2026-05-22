Move `future.v8_splitRouteModules` to a top-level `splitRouteModules` config option and change the default behavior to `true`

- Set `splitRouteModules: false` to keep route modules in a single chunk
- Set `splitRouteModules: "enforce"` to require all routes to be splittable
