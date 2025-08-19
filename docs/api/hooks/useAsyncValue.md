---
title: useAsyncValue
---

# useAsyncValue

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useAsyncValue.html)

Returns the resolved promise value from the closest [`<Await>`](../components/Await).

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
function useAsyncValue(): unknown
```

## Returns

The resolved value from the nearest [`Await`](../components/Await) component

