---
"@react-router/dev": minor
"react-router": minor
---

### Typesafety improvements

React Router now generates types for each of your route modules.
You can access those types by importing them from `./+types/<route filename without extension>`.
For example:

```ts
// app/routes/product.tsx
import type * as Route from "./+types/product";

export function loader({ params }: Route.LoaderArgs) {}

export default function Component({ loaderData }: Route.ComponentProps) {}
```

This initial implementation targets type inference for:

- `Params` : Path parameters from your routing config in `routes.ts` including file-based routing
- `LoaderData` : Loader data from `loader` and/or `clientLoader` within your route module
- `ActionData` : Action data from `action` and/or `clientAction` within your route module

In the future, we plan to add types for the rest of the route module exports: `meta`, `links`, `headers`, `shouldRevalidate`, etc.
We also plan to generate types for typesafe `Link`s:

```tsx
<Link to="/products/:id" params={{ id: 1 }} />
//        ^^^^^^^^^^^^^          ^^^^^^^^^
// typesafe `to` and `params` based on the available routes in your app
```

Check out our docs for more:

- [_Explanations > Type Safety_](https://reactrouter.com/dev/guides/explanation/type-safety)
- [_How-To > Setting up type safety_](https://reactrouter.com/dev/guides/how-to/setting-up-type-safety)
