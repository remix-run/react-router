---
title: useAsyncValue
new: true
---

# `useAsyncValue`

<details>
  <summary>Type declaration</summary>

```tsx
export declare function useAsyncValue(): unknown;
```

</details>

```tsx
function Accessor() {
  const data = useAsyncValue();
  return <p>{data}</p>;
}

<Await promise={promise}>
  <Accessor />
</Await>;
```

This hook returns the resolved data from the nearest `<Await>` component. See the [`<Await>` docs][await docs] for more information.

[await docs]: ../components/await
