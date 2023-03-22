---
"@remix-run/router": patch
---

Remove `instanceof` check for `DeferredData` to be resiliant to ESM/CJS boundaries in SSR bundling scenarios
