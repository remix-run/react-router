---
"@react-router/dev": major
---

For Remix consumers migrating to React Router who used the Vite plugin's `buildEnd` hook, the resolved `reactRouterConfig` object no longer contains a `publicPath` property since this belongs to Vite, not React Router.
