---
"@react-router/dev": patch
---

Reinstate dependency optimization in the child compiler to fix `depsOptimizer is required in dev mode` errors when using `vite-plugin-cloudflare` and importing Node.js builtins
