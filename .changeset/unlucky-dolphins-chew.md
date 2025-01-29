---
"@react-router/dev": patch
"react-router": patch
---

Disable Lazy Route Discovery for all `ssr:false` app and not just "SPA Mode" because there is no runtime server to serve the search-param-configured `/__manifest` requests

- We previously only disabled this for "SPA Mode" which is `ssr:false` and no `prerender` config but we realized it should apply to all `ssr:false` apps, including those prerendeirng multiple pages.
- In those `prerender` scenarios we would prerender the `/__manifest` file assuming the static file server would serve it but that makes some unneccesary assumptions about the static file server behaviors
