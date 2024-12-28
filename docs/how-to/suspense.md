---
title: Streaming with Suspense
---

# Streaming with Suspense

Streaming with React Suspense allows apps to speed up initial renders by deferring non-critical data and unblocking UI rendering.

React Router supports React Suspense by returning promises from loaders and actions.

## 1. Return a promise from loader

React Router awaits route loaders before rendering route components. To unblock the loader for non-critical data, return the promise instead of awaiting it in the loader.

```tsx
import type { Route } from "./+types/my-route";

export async function loader({}: Route.LoaderArgs) {
  // note this is NOT awaited
  let nonCriticalData = new Promise((res) =>
    setTimeout(() => res("non-critical"), 5000)
  );

  let criticalData = await new Promise((res) =>
    setTimeout(() => res("critical"), 300)
  );

  return { nonCriticalData, criticalData };
}
```

## 2. Render the fallback and resolved UI

The promise will be available on `loaderData`, `<Await>` will await the promise and trigger `<Suspense>` to render the fallback UI.

```tsx
import * as React from "react";
import { Await } from "react-router";

// [previous code]

export default function MyComponent({
  loaderData,
}: Route.ComponentProps) {
  let { criticalData, nonCriticalData } = loaderData;

  return (
    <div>
      <h1>Streaming example</h1>
      <h2>Critical data value: {criticalData}</h2>

      <React.Suspense fallback={<div>Loading...</div>}>
        <Await resolve={nonCriticalData}>
          {(value) => <h3>Non critical value: {value}</h3>}
        </Await>
      </React.Suspense>
    </div>
  );
}
```

## With React 19

If you're experimenting with React 19, you can use `React.use` instead of `Await`, but you'll need to create a new component and pass the promise down to trigger the suspense fallback.

```tsx
<React.Suspense fallback={<div>Loading...</div>}>
  <NonCriticalUI p={nonCriticalData} />
</React.Suspense>
```

```tsx
function NonCriticalUI({ p }: { p: Promise<string> }) {
  let value = React.use(p);
  return <h3>Non critical value {value}</h3>;
}
```
