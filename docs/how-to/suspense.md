---
title: Streaming with Suspense
---

# Streaming with Suspense

[MODES: framework, data]

<br/>
<br/>

Streaming with React Suspense allows apps to speed up initial renders by deferring non-critical data and unblocking UI rendering.

React Router supports React Suspense by returning promises from loaders and actions.

## 1. Return a promise from loader

React Router awaits route loaders before rendering route components. To unblock the loader for non-critical data, return the promise instead of awaiting it in the loader.

```tsx
import type { Route } from "./+types/my-route";

export async function loader({}: Route.LoaderArgs) {
  // note this is NOT awaited
  let nonCriticalData = new Promise((res) =>
    setTimeout(() => res("non-critical"), 5000),
  );

  let criticalData = await new Promise((res) =>
    setTimeout(() => res("critical"), 300),
  );

  return { nonCriticalData, criticalData };
}
```

Note you can't return a single promise, it must be an object with keys.

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

If you're using React 19, you can use `React.use` instead of `Await`, but you'll need to create a new component and pass the promise down to trigger the suspense fallback.

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

## Timeouts

By default, loaders and actions reject any outstanding promises after 4950ms. You can control this by exporting a `streamTimeout` numerical value from your `entry.server.tsx`.

```ts filename=entry.server.tsx
// Reject all pending promises from handler functions after 10 seconds
export const streamTimeout = 10_000;
```

## Handling early rejections (Node)

React Router waits for all loaders to settle (via `Promise.all`) before it begins streaming the response. Once streaming has started, React Router catches subsequent rejections of your streamed promises and surfaces them to your `<Await>` (or React 19 `React.use`) error UI.

However, if a streamed promise rejects _before_ all of the route's loaders have settled, React Router has not yet been able to attach a handler to it. In Node, an unhandled promise rejection will crash the process unless you have a top-level handler registered.

For example, this can happen if a parent route's loader takes longer to resolve than a child route's streamed promise takes to reject:

```tsx
// parent.tsx — slow loader
export async function loader() {
  await new Promise((r) => setTimeout(r, 1000));
  return { parent: "data" };
}

// child.tsx — fast-rejecting streamed promise
export async function loader() {
  let lazy = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("boom")), 100),
  );
  return { lazy };
}
```

When `lazy` rejects before the parent loader resolves, the rejection bubbles to the node process as an unhandled rejection, which will crash the process without a user-defined handler.

To prevent this, register a process-level `unhandledRejection` handler in your server entry:

```ts filename=entry.server.ts
process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "Unhandled Rejection at:",
    promise,
    "reason:",
    reason,
  );
});
```
