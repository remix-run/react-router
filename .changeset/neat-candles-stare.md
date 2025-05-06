---
"@react-router/dev": patch
"react-router": patch
---

Better types for `params`

For example:

```ts
// routes.ts
import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("parent/:p", "routes/parent.tsx", [
    route("route/:r", "routes/route.tsx", [
      route("child1/:c1a/:c1b", "routes/child1.tsx"),
      route("child2/:c2a/:c2b", "routes/child2.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
```

Previously, `params` for `routes/route` were calculated as `{ p: string, r: string }`.
This incorrectly ignores params that could come from child routes.
If visiting `/parent/1/route/2/child1/3/4`, the actual params passed to `routes/route` will have a type of `{ p: string, r: string, c1a: string, c1b: string }`.

Now, `params` are aware of child routes and autocompletion will include child params as optionals:

```ts
params.|
//     ^ cursor is here and you ask for autocompletion
// p: string
// r: string
// c1a?: string
// c1b?: string
// c2a?: string
// c2b?: string
```

You can also narrow the types for `params` as it is implemented as a normalized union of params for each page that includes `routes/route`:

```ts
if (typeof params.c1a === 'string') {
  params.|
  //     ^ cursor is here and you ask for autocompletion
  // p: string
  // r: string
  // c1a: string
  // c1b: string
}
```

---

UNSTABLE: renamed internal `react-router/route-module` export to `react-router/internal`
UNSTABLE: removed `Info` export from generated `+types/*` files
