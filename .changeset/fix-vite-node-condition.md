---
"@react-router/dev": patch
---

fix(vite): do not force `node` condition in non-Node environments

When `v8_viteEnvironmentApi` is enabled, the `"node"` condition is no longer unconditionally added to `externalConditions` for all SSR environments. Instead, it is set per-environment in the `configEnvironment` hook, using `noExternal: true` as the signal that the target runtime is not Node.js (e.g. Cloudflare Workers). This fixes builds for non-Node runtimes that cannot import Node builtins like `http` and `https`.
