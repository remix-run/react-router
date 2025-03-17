---
title: createSearchParams
---

# createSearchParams

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.createSearchParams.html)

Creates a URLSearchParams object using the given initializer.

This is identical to `new URLSearchParams(init)` except it also
supports arrays as values in the object form of the initializer
instead of just strings. This is convenient when you need multiple
values for a given key, but don't want to use an array initializer.

For example, instead of:

```tsx
let searchParams = new URLSearchParams([
  ["sort", "name"],
  ["sort", "price"],
]);
```

you can do:

```
let searchParams = createSearchParams({
  sort: ['name', 'price']
});
```

## Signature

```tsx
createSearchParams(init): URLSearchParams
```

## Params

### init

[modes: framework, data, declarative]

_No documentation_
