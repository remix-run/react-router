---
"@react-router/dev": patch
---

For `unstable_reactRouterRSC` Vite plugin consumers, require `@vitejs/plugin-react` in user Vite config, and more reliably split route modules.

- ⚠️ This is a breaking change if you have begun using the `unstable_reactRouterRSC` Vite plugin - please install `@vitejs/plugin-react` and add the `react` plugin to your Vite plugins array.
