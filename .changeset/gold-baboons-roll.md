---
"@react-router/dev": patch
"react-router": patch
---

Fix typegen when same route is used at multiple paths

For example, `routes/route.tsx` is used at 4 different paths here:

```ts
import { type RouteConfig, route } from "@react-router/dev/routes";
export default [
  route("base/:base", "routes/base.tsx", [
    route("home/:home", "routes/route.tsx", { id: "home" }),
    route("changelog/:changelog", "routes/route.tsx", { id: "changelog" }),
    route("splat/*", "routes/route.tsx", { id: "splat" }),
  ]),
  route("other/:other", "routes/route.tsx", { id: "other" }),
] satisfies RouteConfig;
```

Previously, typegen would arbitrarily pick one of these paths to be the "winner" and generate types for the route module based on that path.
Now, typegen creates unions as necessary for alternate paths for the same route file.
