---
"react-router": patch
"react-router-dom": patch
"@remix-run/router": patch
---

feat: Add `createStaticRouter` for `@remix-run/router` SSR usage

Notable changes:

- `request` is now the driving force inside the router utils, so that we can better handle `Request` instances coming form the server (as opposed to `string` and `Path` instances coming from the client)
- Removed the `signal` param from `loader` and `action` functions in favor of `request.signal`
