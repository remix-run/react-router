---
title: useDeferredData
new: true
---

# `useDeferredData`

<details>
  <summary>Type declaration</summary>

```tsx
export declare function useDeferredData<
  Data
>(): ResolvedDeferrable<Data>;
```

</details>

```tsx
function Accessor() {
  const value = useDeferredData();
  return <p>{value}</p>;
}

<Deferred value={deferredValue}>
  <Accessor />
</Deferred>;
```

This hook returns the resolved data from the nearest `<Deferred>` component. See the [`<Deferred>` docs][deferred docs] for more information.

[deferred docs]: ../components/deferred
