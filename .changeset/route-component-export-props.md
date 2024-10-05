---
"@react-router/dev": minor
"react-router": minor
---

Params, loader data, and action data as props for route component exports

```tsx
export default function Component({ params, loaderData, actionData }) {}

export function HydrateFallback({ params }) {}
export function ErrorBoundary({ params, loaderData, actionData }) {}
```
