---
title: useAsyncValue
---

# useAsyncValue

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Hey! Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please find the definition of this API and edit the JSDoc
comments accordingly and this file will be re-generated once those
changes are merged.
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
useAsyncValue(): unknown
```

