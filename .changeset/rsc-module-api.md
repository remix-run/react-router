---
"@react-router/dev": patch
"react-router": patch
---

UNSTABLE RSC FRAMEWORK MODE BREAKING CHANGE - Existing route module exports remain unchanged from stable v7 non-RSC mode, but new exports are added for RSC mode. If you want to use RSC features, you will need to update your route modules to export the new annotations.

If you are using RSC framework mode currently, you will need to update your route modules to the new conventions. The following route module components have their own mutually exclusive server component counterparts:

| Server Component Export | Client Component  |
| ----------------------- | ----------------- |
| `ServerComponent`       | `default`         |
| `ServerErrorBoundary`   | `ErrorBoundary`   |
| `ServerLayout`          | `Layout`          |
| `ServerHydrateFallback` | `HydrateFallback` |

If you were previously exporting a `ServerComponent`, your `ErrorBoundary`, `Layout`, and `HydrateFallback` were also server components. If you want to keep those as server components, you can rename them and prefix them with `Server`. If you were previously importing the implementations of those components from a client module, you can simply inline them.

Example:

Before

```tsx
import { ErrorBoundary as ClientErrorBoundary } from "./client";

export function ServerComponent() {
  // ...
}

export function ErrorBoundary() {
  return <ClientErrorBoundary />;
}

export function Layout() {
  // ...
}

export function HydrateFallback() {
  // ...
}
```

After

```tsx
export function ServerComponent() {
  // ...
}

export function ErrorBoundary() {
  // previous implementation of ClientErrorBoundary, this is now a client component
}

export function ServerLayout() {
  // rename previous Layout export to ServerLayout to make it a server component
}

export function ServerHydrateFallback() {
  // rename previous HydrateFallback export to ServerHydrateFallback to make it a server component
}
```
