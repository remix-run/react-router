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

Param values are percent-encoded for use in a path segment: characters that
would change the URL structure (`/`, `?`, `#`, `%`, whitespace, non-ASCII)
are escaped, while characters that RFC 3986 allows literally in a path
segment (`$ & + , ; = : @`) are kept as-is. Note this differs from query-string
encoding (`encodeURIComponent`/`URLSearchParams`), where those characters are
delimiters and must be escaped. Splat (`*`) values are encoded per segment,
preserving `/` separators.

See [RFC 3986 §3.3](https://datatracker.ietf.org/doc/html/rfc3986#section-3.3)

```tsx
const h = href("/:lang?/about", { lang: "en" })
// -> `/en/about`

<Link to={href("/products/:id", { id: "abc123" })} />
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

The route path to resolve

### args

The route params to use when resolving the path

## Returns

The resolved URL path

