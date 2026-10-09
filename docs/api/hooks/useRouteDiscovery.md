---
title: useRouteDiscovery
unstable: true
---

# unstable_useRouteDiscovery

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/ssr/route-discovery.ts
-->

[MODES: framework]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in 
minor/patch releases. Please use with caution and pay **very** close attention 
to release notes for relevant changes.</docs-warning>

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.unstable_useRouteDiscovery.html)

Control lazy route discovery in conventional Framework Mode with
`future.unstable_customRouteDiscovery` enabled. Full-manifest
loading downloads metadata, not route modules. Applications must retain their
versioned assets and maintain compatible server contracts for running clients.

```tsx
let { state, loadAllRoutes } = unstable_useRouteDiscovery({
  onManifestMismatch: async (event) => {
    await event.loadAllRoutes();
  },
});
```

See the [Route Discovery guide](../../how-to/route-discovery) for selective
discovery, handler composition, and recovery behavior.

## Signature

```tsx
function useRouteDiscovery(options: RouteDiscoveryOptions = {})
```

## Params

### options

Awaited discovery and version-mismatch handlers.

## Returns

The client version, full-manifest loading state, and discovery operations.

