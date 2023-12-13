---
title: useHref
---

# `useHref`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useHref(
  to: To,
  options?: { relative?: RelativeRoutingType }
): string;
```

</details>

The `useHref` hook returns a URL that may be used to link to the given `to` location, even outside of React Router.

<docs-info>You may be interested in taking a look at the source for the `<Link>` component in `react-router-dom` to see how it uses `useHref` internally to determine its own `href` value</docs-info>

<docs-info>Please see the [Splat Paths][relativesplatpath] section on the `useResolvedPath` docs for a note on the behavior of the `future.v7_relativeSplatPath` future flag for relative `useHref()` behavior within splat routes</docs-info>

[relativesplatpath]: ../hooks/use-resolved-path#splat-paths
