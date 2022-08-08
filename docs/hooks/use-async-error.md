---
title: useAsyncError
new: true
---

# `useAsyncError`

<details>
  <summary>Type declaration</summary>

```tsx
export declare function useAsyncError(): unknown;
```

</details>

```tsx
function Accessor() {
  const data = useAsyncValue();
  return <p>{data}</p>;
}

function ErrorHandler() {
  const error = useAsyncError();
  return (
    <p>Uh Oh, something went wrong! {error.message}</p>
  );
}

<Await resolve={promise} errorElement={<ErrorElement />}>
  <Accessor />
</Await>;
```

This hook returns the rejection value from the nearest `<Await>` component. See the [`<Await>` docs][await docs] for more information.

[await docs]: ../components/await
