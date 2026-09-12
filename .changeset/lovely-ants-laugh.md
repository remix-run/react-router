---
"@react-router/dev": patch
---

Fix framework props for reexported components

Previously, when re-exporting the `default` component, `HydrateFallback`, or `ErrorBoundary` their corresponding framework props like `params`, `loaderData`, and `actionData` were not provided, causing errors at runtime.
Now, React Router detects re-exports for framework components and provides their corresponding props.

For example, both of these now work:

```ts
export { default } from "./other-module";
```

```ts
function Component({ params, loaderData, actionData }) {
  /* ... */
}
export { Component as default };
```
