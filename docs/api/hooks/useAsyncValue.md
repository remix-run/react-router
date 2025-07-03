---
title: useAsyncValue
---

# useAsyncValue

[MODES: framework]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useAsyncValue.html)

Returns the resolved promise value from the closest [Await](../components/Await).

```tsx
function SomeDescendant() {
  const value = useAsyncValue();
  // ...
}

// somewhere in your app
<Await resolve={somePromise}>
  <SomeDescendant />
</Await>;
```

## Signature

```tsx
useAsyncValue(): unknown
```
