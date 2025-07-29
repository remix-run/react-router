---
"@react-router/cloudflare": patch
"@react-router/architect": patch
"@react-router/express": patch
"@react-router/node": patch
"react-router": patch
---

[UNSTABLE] Change the `unstable_getContext` signature on `RouterProvider`/`HydratedRouter`/`unstable_RSCHydratedRouter` so that it returns an `unstable_RouterContextProvider` instance instead of a `Map` used to contruct the instance internally

- ⚠️ This is a breaking change if you have adopted the `unstable_getContext` prop
