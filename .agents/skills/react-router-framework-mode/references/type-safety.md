---
title: Route Module Types
description: Auto-generated types, typegen setup, typing loaders/actions/fetchers
tags:
  [
    types,
    typescript,
    typegen,
    Route.LoaderArgs,
    Route.ComponentProps,
    useFetcher,
  ]
---

# Route Module Types

React Router generates route-specific types that provide type inference for URL params, loader data, action data, and more.

## Is Typegen Set Up?

Check for these indicators:

1. `.react-router/types/` directory exists (or appears after running `dev`)
2. `tsconfig.json` includes `.react-router/types/**/*`
3. Imports like `import type { Route } from "./+types/my-route"` resolve

**If not set up:** See https://reactrouter.com/how-to/route-module-type-safety

## Importing Types

Import the `Route` namespace from the `+types` directory relative to your route file:

```tsx
import type { Route } from "./+types/my-route";
```

## Available Types

| Type                             | Used For                                       |
| -------------------------------- | ---------------------------------------------- |
| `Route.LoaderArgs`               | Server `loader` function arguments             |
| `Route.ClientLoaderArgs`         | Client `clientLoader` function arguments       |
| `Route.ActionArgs`               | Server `action` function arguments             |
| `Route.ClientActionArgs`         | Client `clientAction` function arguments       |
| `Route.ComponentProps`           | Component props (loaderData, actionData, etc.) |
| `Route.ErrorBoundaryProps`       | `ErrorBoundary` component props                |
| `Route.HydrateFallbackProps`     | `HydrateFallback` component props              |
| `Route.MetaArgs`                 | `meta` function arguments                      |
| `Route.HeadersArgs`              | `headers` function arguments                   |
| `Route.MiddlewareFunction`       | Server middleware function type                |
| `Route.ClientMiddlewareFunction` | Client middleware function type                |

## What Gets Typed

Types are inferred from your route configuration:

- **URL params**: From dynamic segments (`:id`, `:slug`)
- **Loader data**: From `loader` return → `ComponentProps.loaderData`
- **Action data**: From `action` return → `ComponentProps.actionData`
- **Parent data**: Matches include typed data from parent routes

## Example

```tsx
import type { Route } from "./+types/products.$id";

// params.id typed as string (from :id segment)
export async function loader({ params }: Route.LoaderArgs) {
  const product = await db.products.find(params.id);
  return { product };
}

// loaderData.product typed from loader return
export default function Product({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.product.name}</h1>;
}
```

## Type-Safe URLs with `href`

The `href` utility generates type-safe URL paths:

```tsx
import { href } from "react-router";

// Type-safe path generation with params
const aboutUrl = href("/:lang?/about", { lang: "en" });
// → "/en/about"

// Use with Link
<Link to={href("/products/:id", { id: "abc123" })} />;
```

## Typing useFetcher

When using `useFetcher` to call an action from another route, type it with the action's type:

```tsx
import { useFetcher } from "react-router";

// Option 1: Import the action type directly
import type { action } from "./rate";

function RatingForm({ itemId }: { itemId: string }) {
  const fetcher = useFetcher<typeof action>();

  return (
    <fetcher.Form method="post" action={`/items/${itemId}/rate`}>
      <button name="rating" value="5">
        ⭐⭐⭐⭐⭐
      </button>
      {fetcher.data?.success && <span>Saved!</span>}
    </fetcher.Form>
  );
}
```

```tsx
// Option 2: Define inline type for simple cases
type ActionData = { success: boolean; error?: string };

function FavoriteButton({ itemId }: { itemId: string }) {
  const fetcher = useFetcher<ActionData>();

  return (
    <fetcher.Form method="post" action={`/favorites/${itemId}`}>
      <button type="submit">Favorite</button>
    </fetcher.Form>
  );
}
```

## See Also

- [Route Module Type Safety](https://reactrouter.com/how-to/route-module-type-safety)
