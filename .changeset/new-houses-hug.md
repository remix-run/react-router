---
"@react-router/dev": patch
---

Fix errors with `future.unstable_viteEnvironmentApi` when the `ssr` environment has been configured by another plugin to be a custom `Vite.DevEnvironment` rather than the default `Vite.RunnableDevEnvironment`
