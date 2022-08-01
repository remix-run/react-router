---
title: useMatch
---

# `useMatch`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useMatch<
  ParamKey extends ParamParseKey<Path>,
  Path extends string
>(
  pattern: PathPattern<Path> | Path
): PathMatch<ParamKey> | null;
```

</details>

Returns match data about a route at the given path relative to the current location.

See [`matchPath`][matchpath] for more information.

[matchpath]: ../utils/match-path
