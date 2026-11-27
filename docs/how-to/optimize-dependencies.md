---
title: Optimize Dependencies
unstable: true
---

# Optimize Dependencies

[MODES: framework]

<br/>
<br/>

<docs-warning>This guide uses `future.unstable_optimizeDeps`, an experimental flag that may change in patch or minor releases.</docs-warning>

## Enable Dependency Discovery for Route Modules

Vite pre-bundles dependencies during development to support CommonJS packages and reduce the number of requests needed to load dependencies with many modules.

React Router applications use a client entry and route modules instead of an `index.html` entry. Enable `unstable_optimizeDeps` to provide these files to Vite's dependency scanner:

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
```

Restart the development server after changing the configuration. No changes to route modules are required.

Scanning route modules can help Vite discover dependencies before you visit those routes. Otherwise, discovering a dependency after the server starts can trigger another optimization pass and a page reload.

This flag affects development dependency discovery. It does not optimize production bundle sizes or replace [route code splitting][code-splitting].

## Include Dependencies the Scanner Cannot Discover

Imports introduced by a plugin transform may not be visible during the initial scan. If a dependency repeatedly triggers optimization when you visit a route, you can explicitly include it in your Vite configuration:

```ts filename=vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter()],
  optimizeDeps: {
    include: ["your-dependency"],
  },
});
```

Replace `your-dependency` with the package's import specifier. CommonJS dependencies should not be excluded from pre-bundling. See [Vite's dependency optimization options][vite-options] for linked packages and other configuration details.

## Check the Result

Compare development behavior before and after enabling the flag. Visit routes that import different dependencies and look for repeated optimization messages or full-page reloads. Compare both a fresh optimizer cache and subsequent starts using the cache.

Vite caches optimized dependencies in `node_modules/.vite` by default. If you need to repeat a cold-cache comparison, stop the development server, remove its dependency cache, and restart it. Account for a custom Vite `cacheDir` if your project uses one.

If enabling the flag causes dependency optimization problems, remove it and restart the development server. For more background on discovery and caching, see [Vite's dependency pre-bundling guide][vite-pre-bundling].

[code-splitting]: ../explanation/code-splitting
[vite-options]: https://vite.dev/config/dep-optimization-options
[vite-pre-bundling]: https://vite.dev/guide/dep-pre-bundling
