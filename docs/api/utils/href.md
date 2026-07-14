---
title: href
---

# href

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/href.ts
-->

[MODES: framework]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.href.html)

Returns a resolved URL path for the specified route.

```tsx
const h = href("/:lang?/about", { lang: "en" });
// -> "/en/about"

<Link to={href("/products/:id", { id: "abc123" })} />;
```

## Signature

```tsx
function href<Path extends keyof Args>(
  path: Path,
  ...args: Args[Path]
): string
```

## Params

### path

The route path to resolve.

### args

The route parameters required by the path.

## Returns

The resolved URL path with route parameters interpolated.

