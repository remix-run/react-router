---
"react-router": patch
---

- [UNSTABLE] When middleware is enabled, make the `context` parameter read-only (via `Readonly<unstable_RouterContextProvider>`) so that TypeScript will not allow you to write arbitrary fields to it in loaders, actions, or middleware.
