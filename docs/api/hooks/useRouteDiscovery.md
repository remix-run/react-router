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

Control lazy route discovery in Framework Mode with `future.unstable_customRouteDiscovery`
enabled. This allows you to imperatively discover routes as well as add custom behavior
when a manifest version mismatch is detected.  Calling `loadAllRoutes` will load the entire
route manifest for the current (potentially stale) client version - this requires that prior
client artifacts are still available on your CDN _and_ you have not made breaking changes to
the API contracts of your loaders and actions.

See the [Route Discovery guide](../../how-to/route-discovery) for more information and examples.

```tsx
let { state, discoverRoutes, loadAllRoutes } = unstable_useRouteDiscovery({
  onManifestMismatch: async (event) => {
    // Eagerly load the complete route tree for this client without requiring a hard reload
    await event.loadAllRoutes();
  },
});

// Eagerly discover specific routes
discoverRoutes(["/a", "/b"]);
```

## Signature

```tsx
function useRouteDiscovery(options: RouteDiscoveryOptions = {})
```

## Params

### options

An awaited manifest-mismatch handler.

## Returns

The client version, full-manifest loading state, and discovery operations.

