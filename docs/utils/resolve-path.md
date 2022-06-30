---
title: resolvePath
---

# `resolvePath`

<details>
  <summary>Type declaration</summary>

```tsx
declare function resolvePath(
  to: To,
  fromPathname?: string
): Path;

type To = string | Partial<Path>;

interface Path {
  pathname: string;
  search: string;
  hash: string;
}
```

</details>

`resolvePath` resolves a given `To` value into an actual `Path` object with an absolute `pathname`. This is useful whenever you need to know the exact path for a relative `To` value. For example, the `<Link>` component uses this function to know the actual URL it points to.

The [`useResolvedPath` hook][useresolvedpath] uses `resolvePath` internally to resolve the pathname. If `to` contains a pathname, it is resolved against the current route pathname. Otherwise, it is resolved against the current URL (`location.pathname`).

[useresolvedpath]: ../hooks/use-resolved-path
