---
title: generatePath
---

# generatePath

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/router/utils.ts
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.generatePath.html)

Returns a path with params interpolated.

Param values are percent-encoded for use in a path segment: characters that
would change the URL structure (`/`, `?`, `#`, `%`, whitespace, non-ASCII)
are escaped, while characters that RFC 3986 allows literally in a path
segment (`$ & + , ; = : @`) are kept as-is. Note this differs from query-string
encoding (`encodeURIComponent`/`URLSearchParams`), where those characters are
delimiters and must be escaped. Splat (`*`) values are encoded per segment,
preserving `/` separators.

See [RFC 3986 §3.3](https://datatracker.ietf.org/doc/html/rfc3986#section-3.3)

```tsx
import { generatePath } from "react-router";

generatePath("/users/:id", { id: "123" }); // "/users/123"
generatePath("/files/:name", { name: "a b" }); // "/files/a%20b"
generatePath("/releases/:v", { v: "1.0.0+1" }); // "/releases/1.0.0+1"
```

## Signature

```tsx
function generatePath<Path extends string>(
  originalPath: Path,
  params: GeneratePathParams<Path> =  as any,
): string {}
```

## Params

### originalPath

The original path to generate.

### params

The parameters to interpolate into the path.

## Returns

The generated path with parameters interpolated.

