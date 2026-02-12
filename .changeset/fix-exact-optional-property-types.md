---
"react-router": patch
"@react-router/dev": patch
---

Fix TypeScript compatibility with `exactOptionalPropertyTypes: true`

When `exactOptionalPropertyTypes` is enabled in `tsconfig.json`, TypeScript requires that optional properties explicitly allow `undefined` values. The generated types from `react-router typegen` were causing type errors because the `RouteModule` type constraint didn't explicitly allow `undefined` for optional properties like `action`, `loader`, etc.

This change updates the `RouteModule` type definition to explicitly include `| undefined` for all optional properties, making it compatible with `exactOptionalPropertyTypes: true`.

Fixes #14734
