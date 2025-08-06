---
"@react-router/cloudflare": patch
"@react-router/architect": patch
"@react-router/express": patch
"@react-router/node": patch
"react-router": patch
---

[UNSTABLE] Change `getLoadContext` signature (`type GetLoadContextFunction`) when `future.unstable_middleware` is enabled so that it returns an `unstable_RouterContextProvider` instance instead of a `Map` used to contruct the instance internally

- This also removes the `type unstable_InitialContext` export
- ⚠️ This is a breaking change if you have adopted middleware and are using a custom server with a `getLoadContext` function
