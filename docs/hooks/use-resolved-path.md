---
title: useResolvedPath
---

# `useResolvedPath`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useResolvedPath(
  to: To,
  options?: { relative?: RelativeRoutingType }
): Path;
```

</details>

This hook resolves the `pathname` of the location in the given `to` value against the pathname of the current location.

This is useful when building links from relative values. For example, check out the source to [`<NavLink>`][navlink] which calls `useResolvedPath` internally to resolve the full pathname of the page being linked to.

See [resolvePath][resolvepath] for more information.

[navlink]: ../components/nav-link
[resolvepath]: ../utils/resolve-path
