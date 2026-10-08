---
title: preloadRoutePattern
unstable: true
---

# unstable_preloadRoutePattern

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/router/matcher-route-pattern.preload.ts
-->

[MODES: data]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in 
minor/patch releases. Please use with caution and pay **very** close attention 
to release notes for relevant changes.</docs-warning>

## Summary

Initialize the route-pattern matcher before creating a Data Router or static
handler with `future.unstable_routePatternMatching` enabled. Import from
`react-router/route-pattern` and call this once during application startup.
Server and browser applications must each preload their own matcher.

The matcher is statically imported by this module. Tree-shaking bundlers can
remove it from applications that do not use this function. Initialization is
synchronous, and repeated calls are safe.

## Signature

```tsx
function unstable_preloadRoutePattern(): void
```

## Returns

No return value.

