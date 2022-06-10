---
title: createSearchParams
---

# `createSearchParams`

<details>
  <summary>Type declaration</summary>

```tsx
declare function createSearchParams(
  init?: URLSearchParamsInit
): URLSearchParams;
```

</details>

`createSearchParams` is a thin wrapper around [`new URLSearchParams(init)`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/URLSearchParams) that adds support for using objects with array values. This is the same function that `useSearchParams` uses internally for creating `URLSearchParams` objects from `URLSearchParamsInit` values.
