---
"react-router": patch
---

- [UNSTABLE] Convert internal middleware implementations to use the new `staticHandler.query` `unstable_generateMiddlewareResponse` API instead of the previous `unstable_respond` API
- [UNSTABLE] Remove staticHandler `query`/`queryRoute` `unstable_respond` API in favor of the new `unstable_generateMiddlewareResponse` API
