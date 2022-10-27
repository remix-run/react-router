---
title: useAsyncValue
new: true
---

# `useAsyncValue`

Returns the resolved data from the nearest `<Await>` ancestor component.

```tsx
function ProductVariants() {
  const variants = useAsyncValue();
  return <div>{/* ... */}</div>;
}

// Await creates the context for the value
<Await resolve={somePromiseForProductVariants}>
  <ProductVariants />
</Await>;
```

See the [Deferred Data Guide][deferred] and [`<Await>` docs][await docs] for more information.

[await docs]: ../components/await
[deferred]: ../guides/deferred
