---
title: useRouteLoaderData
---

# useRouteLoaderData

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useRouteLoaderData.html)

Returns the loader data for a given route by route ID.

```tsx
import { useRouteLoaderData } from "react-router";

function SomeComponent() {
  const { user } = useRouteLoaderData("root");
}
```

Route IDs are created automatically. They are simply the path of the route file relative to the app folder without the extension.

| Route Filename               | Route ID               |
| ---------------------------- | ---------------------- |
| `app/root.tsx`               | `"root"`               |
| `app/routes/teams.tsx`       | `"routes/teams"`       |
| `app/whatever/teams.$id.tsx` | `"whatever/teams.$id"` |

If you created an ID manually, you can use that instead:

```tsx
route("/", "containers/app.tsx", { id: "app" }})
```

## Signature

```tsx
useRouteLoaderData(routeId): undefined
```

## Params

### routeId

[modes: framework, data]

_No documentation_
