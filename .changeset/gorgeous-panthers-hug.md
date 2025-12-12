---
"@react-router/dev": patch
"react-router": patch
---

In (unstable) RSC Framework Mode, always keep the `ErrorBoundary`, `HydrateFallback` and `Layout` Route Module exports as client components, even when a `ServerComponent` export is present
