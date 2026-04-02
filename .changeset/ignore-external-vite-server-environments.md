---
"@react-router/dev": patch
---

Avoid running React Router's server build cleanup hooks for unrelated Vite server environments when `future.v8_viteEnvironmentApi` is enabled.
