---
"@react-router/dev": patch
---

Fix support for custom SSR build input when `serverBundles` option has been configured

Note that for consumers using the `future.unstable_viteEnvironmentApi` and `serverBundles` options together, hyphens are no longer supported in server bundle IDs since they also need to be valid Vite environment names.
