---
title: useRouteLoaderData
---

# useRouteLoaderData

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useRouteLoaderData.html)

Returns the loader data for a given route by route ID.

Route IDs are created automatically. They are simply the path of the route file
relative to the app folder without the extension.

| Route Filename               | Route ID               |
| ---------------------------- | ---------------------- |
| `app/root.tsx`               | `"root"`               |
| `app/routes/teams.tsx`       | `"routes/teams"`       |
| `app/whatever/teams.$id.tsx` | `"whatever/teams.$id"` |

```tsx
import { useRouteLoaderData } from "react-router";

function SomeComponent() {
  const { user } = useRouteLoaderData("root");
}

// You can also specify your own route ID's manually in your routes.ts file:
route("/", "containers/app.tsx", { id: "app" }})
useRouteLoaderData("app");
```

## Signature

```tsx
useRouteLoaderData(routeId): undefined
```

## Params

### routeId

The ID of the route to return loader data from

