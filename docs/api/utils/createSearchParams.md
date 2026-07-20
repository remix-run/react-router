---
title: createSearchParams
---

# createSearchParams

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/dom.ts
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.createSearchParams.html)

Creates a URLSearchParams object using the given initializer.

This is identical to `new URLSearchParams(init)` except it also supports
arrays as values in the object form of the initializer instead of just
strings. This is convenient when you need multiple values for a given key,
but don't want to use an array initializer.

```tsx
// Instead of:
let searchParams = new URLSearchParams([
  ["sort", "name"],
  ["sort", "price"],
]);

// You can do:
let searchParams = createSearchParams({
  sort: ["name", "price"],
});
```

## Signature

```tsx
function createSearchParams(init: URLSearchParamsInit = ""): URLSearchParams
```

## Params

### init

The value used to initialize the URL search parameters.

## Returns

A URLSearchParams object containing the initialized search
parameters.

