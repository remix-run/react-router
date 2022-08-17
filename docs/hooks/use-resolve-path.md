---
title: useResolvePath
---

# `useResolvePath`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useResolvePath(): (
  to: To,
  options?: { relative?: RelativeRoutingType }
): Path;
```

</details>

This hook returns a function that resolves the `pathname` of the location in the given `to` value against the pathname of the current location.

> **Tip:**
>
> You may be interested in taking a look at the source for the `useResolvedPath`
> component in `react-router` to see how it uses `useResolvePath` internally.
