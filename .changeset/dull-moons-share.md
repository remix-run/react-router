---
"@react-router/dev": patch
---

Load environment variables before evaluating `routes.ts`

For example, you can now compute your routes based on [`VITE_`-prefixed environment variables](https://vite.dev/guide/env-and-mode#env-variables):

```txt
# .env
VITE_ENV_ROUTE=my-route
```

```ts
// app/routes.ts
import { type RouteConfig, route } from "@react-router/dev/routes";

const routes: RouteConfig = [];
if (import.meta.env.VITE_ENV_ROUTE === "my-route") {
  routes.push(route("my-route", "routes/my-route.tsx"));
}

export default routes;
```
