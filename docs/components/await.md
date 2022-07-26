---
title: Await
new: true
---

## `<Await />`

<details>
  <summary>Type declaration</summary>

```tsx
export interface AwaitResolveRenderFunction {
  (data: Awaited<any>): JSX.Element;
}

export interface AwaitProps {
  children: React.ReactNode | AwaitResolveRenderFunction;
  errorElement?: React.ReactNode;
  promise: DeferredPromise;
}

export declare function Await({
  children,
  errorElement,
  promise,
}: AwaitProps): JSX.Element;
```

</details>

This component is responsible for rendering Promises. This can be thought of as a Promise-renderer with a built-in error boundary. You should always render `<Await>` inside a `<React.Suspense>` boundary to handle fallback displays prior to the promise settling.

`<Await>` can be used to resolve the promise in one of two ways:

Directly as a render function:

```tsx
<Await promise={promise}>
  {(data) => <p>{data}</p>}
</Deferred>
```

Or indirectly via the `useAwaitedData` hook:

```tsx
function Accessor() {
  const data = useAwaitedData();
  return <p>{data}</p>;
}

<Await promise={promise}>
  <Accessor />
</Deferred>;
```

`<Await>` is primarily intended to be used with the [`deferred()`][deferred response] data returned from your `loader`. Returning a deferred value from your loader will allow you to render fallbacks with `<Await>`. A full example can be found in the [Deferred guide][deferred guide].

[useloaderdata]: ../hooks/use-loader-data
[deferred response]: ../fetch/deferred
[deferred guide]: ../guides/deferred
