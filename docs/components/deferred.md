---
title: Deferred
new: true
---

## `<Deferred />`

<details>
  <summary>Type declaration</summary>

```tsx
export declare function Deferred<Data = any>({
  children,
  value,
  fallback,
  errorElement,
}: DeferredProps<Data>): JSX.Element;
```

</details>

This component is responsible for resolving deferred values accessed from [`useLoaderData`][useloaderdata]. This can be thought of as an auto-suspending React `<Suspense>` component and an error boundary all in one.

`<Deferred>` can be used to resolve the deferred value in one of two ways:

Directly as a render function:

```tsx
<Deferred value={deferredValue}>
  {(data) => <p>{data}</p>}
</Deferred>
```

Or indirectly via the `useDeferredData` hook:

```tsx
function Accessor() {
  const value = useDeferredData();
  return <p>{value}</p>;
}

<Deferred value={deferredValue}>
  <Accessor />
</Deferred>;
```

`<Deferred>` is paired with [`deferred()`][deferred response] in your `loader`. Returning a deferred value from your loader will allow you to render fallbacks with `<Deferred>`. A full example can be found in the [Deferred guide][deferred guide].

[useloaderdata]: ../hooks/use-loader-data
[deferred response]: ../fetch/deferred
[deferred guide]: ../guides/deferred
