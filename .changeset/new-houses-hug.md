---
"@react-router/dev": patch
---

Fix `future.unstable_viteEnvironmentApi` when the `ssr` environment has been configured by another plugin to be a raw `Vite.DevEnvironment` rather than a `Vite.RunnableDevEnvironment`
