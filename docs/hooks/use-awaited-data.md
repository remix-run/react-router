---
title: useAwaitedData
new: true
---

# `useAwaitedData`

<details>
  <summary>Type declaration</summary>

```tsx
export declare function useAwaitedData(): unknown;
```

</details>

```tsx
function Accessor() {
  const data = useAwaitedData();
  return <p>{data}</p>;
}

<Await promise={promise}>
  <Accessor />
</Await>;
```

This hook returns the resolved data from the nearest `<Await>` component. See the [`<Await>` docs][await docs] for more information.

[await docs]: ../components/await
