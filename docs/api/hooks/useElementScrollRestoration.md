---
title: useElementScrollRestoration
unstable: true
---

# unstable_useElementScrollRestoration

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/lib.tsx
-->

[MODES: framework, data]

<docs-warning>This API is experimental and subject to breaking changes in 
minor/patch releases. Please use with caution and pay **very** close attention 
to release notes for relevant changes.</docs-warning>

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.unstable_useElementScrollRestoration.html)

Restore an independently scrolling element on navigation. The selector should
identify one stable, unique container across routes and reloads. Mount this
hook with the container; no returned props or ref are needed.

```tsx
function Sidebar() {
  unstable_useElementScrollRestoration("#sidebar");
  return <aside id="sidebar" style={{ overflow: "auto", height: "100vh" }} />;
}
```

Multiple containers share the root [`ScrollRestoration`](../components/ScrollRestoration)'s `getKey` and
`storageKey`. Without that component, Data Mode and Framework SPA Mode use
`location.key` and default storage. Standalone hooks do not manage window
scrolling. Framework SSR requires the root component after container markup
to restore persisted selectors before hydration. RSC consumers use this hook
in a client component.

Restoration is attempted once per navigation or container mount. Hydration
does not repeat an early script restoration. Missing targets are skipped and
growing content, images, or virtualizers do not trigger retries; render the
content needed for restoration with the container.

See the [Element Scroll Restoration guide](../../how-to/element-scroll-restoration)
for root configuration and multiple-container examples.

## Signature

```tsx
function useElementScrollRestoration(selector: string): void
```

## Params

### selector

A CSS selector identifying the scroll container. The first matching element is used.

## Returns

No return value.

